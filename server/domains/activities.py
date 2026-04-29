import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Session, joinedload
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and internal domain imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.exercises import ExerciseTree


# --- Database Model ---

class ActivityLog(Base):
    """
    SQLAlchemy model for recording exercise performance.
    Stores specific data (weight, reps, duration, etc.) as JSONB
    to support diverse exercise types.
    """
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Links the activity to a specific workout session.
    workout_session_id = Column(
        Integer,
        ForeignKey("workout_sessions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Use a callable for timezone-aware UTC default
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    performance_data = Column(JSONB, nullable=False)  # List of PerformanceEntry objects

    # Relationships
    exercise = relationship("ExerciseTree")
    user = relationship("User")
    # workout_session relationship is resolved via string to avoid circular dependency
    workout_session = relationship("WorkoutSession", back_populates="logs")


# --- Pydantic Schemas ---

class PerformanceEntry(BaseModel):
    """Structure for a single measurement within an activity (e.g., Weight: 10kg)."""
    parameter_id: int
    parameter_name: str
    unit: str
    value: str


class ActivityLogBase(BaseModel):
    exercise_id: int
    performance_data: List[PerformanceEntry]
    workout_session_id: Optional[int] = None


class ActivityLogCreate(ActivityLogBase):
    """Schema for creating a new log entry."""
    pass


class ActivityLogUpdate(BaseModel):
    """Schema for updating an existing log entry."""
    timestamp: Optional[datetime] = None
    performance_data: Optional[List[PerformanceEntry]] = None
    model_config = ConfigDict(from_attributes=True)


class ActivityLogOut(ActivityLogBase):
    """Schema for returning activity data, enriched with metadata and session info."""
    id: int
    user_id: uuid.UUID
    timestamp: datetime
    exercise_name: Optional[str] = None
    user_full_name: Optional[str] = None
    # Field for UI to group logs by session name
    workout_session_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- ActivityLogService ---

class ActivityLogService:
    """
    Service layer for handling activity logs.
    """

    def __init__(self, db: Session):
        self.db = db

    def _get_all_child_exercise_ids(self, parent_id: int) -> List[int]:
        """Recursively finds all exercise IDs under a specific parent category."""
        ids = [parent_id]
        children = self.db.query(ExerciseTree.id).filter(ExerciseTree.parent_id == parent_id).all()
        for child_id, in children:
            ids.extend(self._get_all_child_exercise_ids(child_id))
        return ids

    def create_log(self, user_id: uuid.UUID, data: ActivityLogCreate) -> ActivityLog:
        """Persists a new activity log entry for a specific user."""
        new_log = ActivityLog(
            user_id=user_id,
            exercise_id=data.exercise_id,
            workout_session_id=data.workout_session_id,
            performance_data=[entry.model_dump() for entry in data.performance_data],
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(new_log)
        self.db.commit()
        self.db.refresh(new_log)
        return new_log

    def get_logs_by_exercise(self, user_id: uuid.UUID, exercise_id: int) -> List[ActivityLog]:
        """
        Retrieves logs enriched with exercise names and workout session names.
        """
        # Local import to prevent Circular Dependency and allow class-bound attribute access
        from domains.workout_sessions import WorkoutSession

        target_ids = self._get_all_child_exercise_ids(exercise_id)

        logs = (
            self.db.query(ActivityLog)
            .filter(
                ActivityLog.exercise_id.in_(target_ids),
                ActivityLog.user_id == user_id
            )
            .options(
                joinedload(ActivityLog.exercise),
                # Chain joinedloads using class-bound attributes (WorkoutSession.template)
                joinedload(ActivityLog.workout_session).joinedload(WorkoutSession.template)
            )
            .order_by(ActivityLog.timestamp.desc())
            .all()
        )

        for log in logs:
            log.exercise_name = log.exercise.name

            # Identify the session name for the UI
            if log.workout_session:
                if log.workout_session.template:
                    log.workout_session_name = log.workout_session.template.name
                else:
                    log.workout_session_name = "אימון אישי"
            else:
                log.workout_session_name = None

        return logs

    def update_log(self, log_id: int, user_id: uuid.UUID, update_data: dict) -> Optional[ActivityLog]:
        """Updates a log entry after verifying user ownership."""
        db_log = self.db.query(ActivityLog).filter(
            ActivityLog.id == log_id,
            ActivityLog.user_id == user_id
        ).first()

        if not db_log:
            return None

        for key, value in update_data.items():
            if key == "performance_data" and isinstance(value, list):
                processed_list = []
                for entry in value:
                    if hasattr(entry, "model_dump"):
                        processed_list.append(entry.model_dump())
                    else:
                        processed_list.append(entry)
                setattr(db_log, key, processed_list)
            else:
                setattr(db_log, key, value)

        self.db.commit()
        self.db.refresh(db_log)
        db_log.exercise_name = db_log.exercise.name
        return db_log

    def delete_log(self, log_id: int, user_id: uuid.UUID) -> bool:
        """Deletes a log entry after verifying user ownership."""
        db_log = self.db.query(ActivityLog).filter(
            ActivityLog.id == log_id,
            ActivityLog.user_id == user_id
        ).first()

        if not db_log:
            return False

        self.db.delete(db_log)
        self.db.commit()
        return True


# --- Router Setup ---

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.post("", response_model=ActivityLogOut, status_code=status.HTTP_201_CREATED)
async def create_activity_log(
        data: ActivityLogCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Records a new exercise performance entry."""
    service = ActivityLogService(db)
    return service.create_log(current_user.id, data)


@router.get("/{exercise_id}", response_model=List[ActivityLogOut])
async def get_activity_history(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches performance history for an exercise and its sub-categories."""
    service = ActivityLogService(db)
    return service.get_logs_by_exercise(current_user.id, exercise_id)


@router.patch("/{log_id}", response_model=ActivityLogOut)
async def update_activity_entry(
        log_id: int,
        log_update: ActivityLogUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing log entry."""
    service = ActivityLogService(db)
    update_dict = log_update.model_dump(exclude_unset=True)
    updated_log = service.update_log(log_id, current_user.id, update_dict)

    if not updated_log:
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")
    return updated_log


@router.delete("/{log_id}")
async def delete_activity_entry(
        log_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a log entry."""
    service = ActivityLogService(db)
    if not service.delete_log(log_id, current_user.id):
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")
    return {"message": "Log entry deleted successfully"}