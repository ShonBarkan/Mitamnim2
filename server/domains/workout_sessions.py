import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Session, joinedload
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and domain imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog
from domains.parameters import Parameter


# --- Database Model ---

class WorkoutSession(Base):
    """
    SQLAlchemy model representing a completed workout session.
    Each session is linked to multiple ActivityLog entries, where each entry represents one set.
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)

    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), server_default=func.now())

    workout_summary = Column(Text, nullable=True)
    actual_duration = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User")
    template = relationship("WorkoutTemplate")
    # Links to individual sets (ActivityLogs)
    logs = relationship("ActivityLog", back_populates="workout_session", cascade="all, delete-orphan")


# --- Pydantic Schemas ---

class ParamValueSchema(BaseModel):
    """Simplified parameter storage: only ID and Value."""
    parameter_id: int
    value: str


class PerformedExerciseSchema(BaseModel):
    """Payload for an exercise containing multiple sets."""
    exercise_id: int
    # Each inner list represents one set: List[List[ParamValue]]
    performance_data: List[List[ParamValueSchema]]


class WorkoutSessionFinish(BaseModel):
    """Payload to finalize a workout session."""
    template_id: Optional[int] = None
    start_time: datetime
    workout_summary: Optional[str] = None
    actual_duration: Optional[str] = None
    performed_exercises: List[PerformedExerciseSchema]


class WorkoutSessionOut(BaseModel):
    """Response schema for workout session metadata."""
    id: int
    user_id: uuid.UUID
    template_id: Optional[int]
    template_name: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime]
    workout_summary: Optional[str]
    actual_duration: Optional[str]
    exercise_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# --- WorkoutSessionService ---

class WorkoutSessionService:
    def __init__(self, db: Session):
        self.db = db

    def _calculate_virtual_value(self, calc_type: str, sources: List[float], multiplier: float) -> str:
        """Core math engine for dependent (virtual) parameters."""
        try:
            if calc_type == 'sum':
                res = sum(sources)
            elif calc_type == 'subtract':
                res = sources[0] - (sources[1] if len(sources) > 1 else 0)
            elif calc_type == 'multiply':
                res = 1
                for v in sources: res *= v
            elif calc_type == 'divide':
                res = sources[0] / sources[1] if len(sources) > 1 and sources[1] != 0 else 0
            elif calc_type == 'percentage':
                res = (sources[0] / sources[1] * 100) if len(sources) > 1 and sources[1] != 0 else 0
            elif calc_type == 'conversion':
                res = sources[0] * (multiplier or 1)
            else:
                res = 0

            return f"{res:.2f}".rstrip('0').rstrip('.')
        except Exception:
            return "0"

    def finish_workout(self, user: User, data: WorkoutSessionFinish) -> WorkoutSession:
        """
        Finalizes the workout. Splits the bulk payload so that each set
        becomes a separate ActivityLog entry.
        """
        if not data.performed_exercises:
            raise ValueError("לא ניתן לסיים אימון ללא תרגילים שבוצעו")

        # Fetch all group parameters to calculate virtual values server-side if missing
        all_params = {p.id: p for p in self.db.query(Parameter).filter(Parameter.group_id == user.group_id).all()}

        end_time = datetime.now(timezone.utc)

        # Create main session record
        db_session = WorkoutSession(
            user_id=user.id,
            template_id=data.template_id,
            start_time=data.start_time,
            end_time=end_time,
            workout_summary=data.workout_summary,
            actual_duration=data.actual_duration
        )
        self.db.add(db_session)
        self.db.flush()

        # Iterate through exercises and their corresponding sets
        for exercise in data.performed_exercises:
            for set_data in exercise.performance_data:
                # current_set_values: {param_id: value} for lookup/math
                current_set_values = {p.parameter_id: p.value for p in set_data}

                # Final set performance data (flat list of params for this single set)
                final_set_params = [p.model_dump() for p in set_data]

                # Check and calculate virtual parameters for this specific set
                for p_id, p_meta in all_params.items():
                    if p_meta.is_virtual and p_id not in current_set_values:
                        source_ids = p_meta.source_parameter_ids or []
                        if all(sid in current_set_values for sid in source_ids):
                            source_values = [float(current_set_values[sid]) for sid in source_ids]
                            calculated_val = self._calculate_virtual_value(
                                p_meta.calculation_type,
                                source_values,
                                p_meta.multiplier
                            )
                            final_set_params.append({"parameter_id": p_id, "value": calculated_val})

                # Create a SEPARATE row for EACH SET
                set_log = ActivityLog(
                    exercise_id=exercise.exercise_id,
                    user_id=user.id,
                    workout_session_id=db_session.id,
                    timestamp=end_time,
                    performance_data=final_set_params  # JSONB: List[Dict] for one set
                )
                self.db.add(set_log)

        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def get_user_history(self, user_id: uuid.UUID) -> List[WorkoutSession]:
        """Retrieves history and counts unique exercises performed in each session."""
        sessions = (
            self.db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.template))
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.start_time.desc())
            .all()
        )

        for s in sessions:
            s.template_name = s.template.name if s.template else "אימון מותאם אישית"
            # Count unique exercise_ids across all logs (sets) in the session
            unique_exercises = {log.exercise_id for log in s.logs}
            s.exercise_count = len(unique_exercises)

        return sessions


# --- Router Setup ---

router = APIRouter(prefix="/workout-sessions", tags=["Workout Sessions"])


@router.post("/finish", response_model=WorkoutSessionOut)
async def finish_workout_session(
        data: WorkoutSessionFinish,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Endpoint to submit and split workout results into individual sets."""
    service = WorkoutSessionService(db)
    try:
        return service.finish_workout(current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Server Error during finish_workout: {e}")
        raise HTTPException(status_code=500, detail="שגיאה פנימית בשמירת האימון")


@router.get("/history", response_model=List[WorkoutSessionOut])
async def get_workout_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves workout history for the current user."""
    service = WorkoutSessionService(db)
    return service.get_user_history(current_user.id)