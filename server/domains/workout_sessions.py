import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and domain imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog
from domains.parameters import Parameter  # Assuming Parameter model exists in parameters.py


# --- Database Model ---

class WorkoutSession(Base):
    """
    SQLAlchemy model representing a completed workout session.
    Logs contain performance_data structured as List of Lists:
    Each inner list represents a 'Set' containing {parameter_id, value}.
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
    logs = relationship("ActivityLog", back_populates="workout_session", cascade="all, delete-orphan")


# --- Pydantic Schemas ---

class ParamValueSchema(BaseModel):
    """Simplified parameter storage: only ID and Value."""
    parameter_id: int
    value: str


class PerformedExerciseSchema(BaseModel):
    exercise_id: int
    # Each list inside performance_data represents a 'Set'
    performance_data: List[List[ParamValueSchema]]


class WorkoutSessionFinish(BaseModel):
    template_id: Optional[int] = None
    start_time: datetime
    workout_summary: Optional[str] = None
    actual_duration: Optional[str] = None
    performed_exercises: List[PerformedExerciseSchema]


class WorkoutSessionOut(BaseModel):
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
        """Core math engine for dependent parameters."""
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
        if not data.performed_exercises:
            raise ValueError("לא ניתן לסיים אימון ללא תרגילים")

        # Fetch all parameters to identify virtual ones and their logic
        all_params = {p.id: p for p in self.db.query(Parameter).filter(Parameter.group_id == user.group_id).all()}

        end_time = datetime.now(timezone.utc)
        duration_str = data.actual_duration
        if not duration_str:
            delta = end_time - data.start_time
            duration_str = f"{delta.seconds // 60} דקות"

        db_session = WorkoutSession(
            user_id=user.id,
            template_id=data.template_id,
            start_time=data.start_time,
            end_time=end_time,
            workout_summary=data.workout_summary,
            actual_duration=duration_str
        )
        self.db.add(db_session)
        self.db.flush()

        for exercise in data.performed_exercises:
            processed_logs = []

            for set_data in exercise.performance_data:
                # Convert input to a dictionary for easy source lookup
                current_set_values = {p.parameter_id: p.value for p in set_data}

                # We need to ensure all parameters (including virtual ones) are stored
                # We iterate over the exercise's required parameters (logic here simplified)
                final_set = []

                # First, add the provided raw values
                for p in set_data:
                    final_set.append(p.model_dump())

                # Second, check for missing virtual parameters that depend on these raw values
                for p_id, p_meta in all_params.items():
                    if p_meta.is_virtual and p_id not in current_set_values:
                        source_ids = p_meta.source_parameter_ids or []

                        # If all sources are present in the current set, calculate the virtual param
                        if all(sid in current_set_values for sid in source_ids):
                            source_values = [float(current_set_values[sid]) for sid in source_ids]
                            calculated_val = self._calculate_virtual_value(
                                p_meta.calculation_type,
                                source_values,
                                p_meta.multiplier
                            )
                            final_set.append({"parameter_id": p_id, "value": calculated_val})

                processed_logs.append(final_set)

            log_entry = ActivityLog(
                exercise_id=exercise.exercise_id,
                user_id=user.id,
                workout_session_id=db_session.id,
                timestamp=data.start_time,
                performance_data=processed_logs  # JSONB List of Lists of Dicts
            )
            self.db.add(log_entry)

        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def get_user_history(self, user_id: uuid.UUID) -> List[WorkoutSession]:
        sessions = self.db.query(WorkoutSession).filter(
            WorkoutSession.user_id == user_id
        ).order_by(WorkoutSession.start_time.desc()).all()

        for s in sessions:
            s.template_name = s.template.name if s.template else "אימון מותאם אישית"
            s.exercise_count = len(s.logs)

        return sessions


# --- Router Setup ---

router = APIRouter(prefix="/workout-sessions", tags=["Workout Sessions"])


@router.post("/finish", response_model=WorkoutSessionOut)
async def finish_workout_session(
        data: WorkoutSessionFinish,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = WorkoutSessionService(db)
    try:
        return service.finish_workout(current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail="שגיאה פנימית בשמירת האימון")


@router.get("/history", response_model=List[WorkoutSessionOut])
async def get_workout_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = WorkoutSessionService(db)
    return service.get_user_history(current_user.id)