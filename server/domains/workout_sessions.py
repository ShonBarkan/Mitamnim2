import uuid
from datetime import datetime, timedelta, timezone  # Added timezone
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and domain imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog, PerformanceEntry


# --- Database Model ---

class WorkoutSession(Base):
    """
    SQLAlchemy model representing a completed workout session.
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)

    # Changed default to a callable that ensures UTC awareness if needed by DB
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

class PerformedExerciseSchema(BaseModel):
    exercise_id: int
    performance_data: List[PerformanceEntry]


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

    def finish_workout(self, user_id: uuid.UUID, data: WorkoutSessionFinish) -> WorkoutSession:
        if not data.performed_exercises:
            raise ValueError("Cannot finish a workout with no exercises.")

        # FIX: Ensure end_time is timezone-aware (UTC) to match incoming Pydantic datetime
        # This prevents the "can't subtract offset-naive and offset-aware datetimes" error.
        end_time = datetime.now(timezone.utc)

        duration_str = data.actual_duration
        if not duration_str:
            # Now subtraction works because both are offset-aware
            delta = end_time - data.start_time
            duration_str = f"{delta.seconds // 60} min"

        # Create the session record
        db_session = WorkoutSession(
            user_id=user_id,
            template_id=data.template_id,
            start_time=data.start_time,
            end_time=end_time,
            workout_summary=data.workout_summary,
            actual_duration=duration_str
        )
        self.db.add(db_session)
        self.db.flush()

        # Create activity logs
        for i, exercise in enumerate(data.performed_exercises):

            log_entry = ActivityLog(
                exercise_id=exercise.exercise_id,
                user_id=user_id,
                workout_session_id=db_session.id,
                timestamp=data.start_time,
                performance_data=[p.model_dump() for p in exercise.performance_data]
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
            s.template_name = s.template.name if s.template else "Custom Workout"
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
        return service.finish_workout(current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catching other errors (like the previous TypeError) to provide context
        print(f"Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while saving the workout.")


@router.get("/history", response_model=List[WorkoutSessionOut])
async def get_workout_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = WorkoutSessionService(db)
    return service.get_user_history(current_user.id)