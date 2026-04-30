import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict

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
from domains.parameters import Parameter


# --- Database Model ---

class ActivityLog(Base):
    """
    SQLAlchemy model for recording exercise performance.
    Performance data is stored as a list of dicts: [{'parameter_id': int, 'value': str}]
    """
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="SET NULL"), nullable=True)

    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    performance_data = Column(JSONB, nullable=False)

    # Relationships
    exercise = relationship("ExerciseTree")
    user = relationship("User")
    workout_session = relationship("WorkoutSession", back_populates="logs")


# --- Pydantic Schemas ---

class PerformanceEntry(BaseModel):
    """Enriched structure for API responses."""
    parameter_id: int
    parameter_name: Optional[str] = None
    unit: Optional[str] = None
    value: str


class ActivityLogBase(BaseModel):
    exercise_id: int
    performance_data: List[PerformanceEntry]
    workout_session_id: Optional[int] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    performance_data: Optional[List[PerformanceEntry]] = None
    model_config = ConfigDict(from_attributes=True)


class ActivityLogOut(ActivityLogBase):
    id: int
    user_id: uuid.UUID
    timestamp: datetime
    exercise_name: Optional[str] = None
    user_full_name: Optional[str] = None
    workout_session_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- ActivityLogService ---

class ActivityLogService:
    def __init__(self, db: Session):
        self.db = db

    def _get_all_child_exercise_ids(self, parent_id: int) -> List[int]:
        ids = [parent_id]
        children = self.db.query(ExerciseTree.id).filter(ExerciseTree.parent_id == parent_id).all()
        for child_id, in children:
            ids.extend(self._get_all_child_exercise_ids(child_id))
        return ids

    def _enrich_performance_data(self, logs: List[ActivityLog]):
        """
        Enriches the JSONB performance_data with names and units from the Parameter table.
        Uses a bulk query to avoid N+1 performance issues.
        """
        if not logs:
            return

        # Extract all unique parameter IDs from the logs
        param_ids = set()
        for log in logs:
            for entry in log.performance_data:
                param_ids.add(entry.get("parameter_id"))

        # Bulk fetch parameter metadata
        params = self.db.query(Parameter.id, Parameter.name, Parameter.unit).filter(
            Parameter.id.in_(param_ids)
        ).all()

        # Map metadata for fast lookup
        param_map = {p.id: {"name": p.name, "unit": p.unit} for p in params}

        # Inject metadata into the performance_data structure
        for log in logs:
            enriched_data = []
            for entry in log.performance_data:
                p_id = entry.get("parameter_id")
                meta = param_map.get(p_id, {})
                enriched_data.append({
                    "parameter_id": p_id,
                    "parameter_name": meta.get("name", "Unknown"),
                    "unit": meta.get("unit", ""),
                    "value": entry.get("value")
                })
            log.performance_data = enriched_data

    def create_log(self, user_id: uuid.UUID, data: ActivityLogCreate) -> ActivityLog:
        # Strip enriched data before saving to keep JSONB clean (only ID and Value)
        clean_performance = [
            {"parameter_id": entry.parameter_id, "value": entry.value}
            for entry in data.performance_data
        ]

        new_log = ActivityLog(
            user_id=user_id,
            exercise_id=data.exercise_id,
            workout_session_id=data.workout_session_id,
            performance_data=clean_performance,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(new_log)
        self.db.commit()
        self.db.refresh(new_log)

        # Enrich for the immediate response
        self._enrich_performance_data([new_log])
        new_log.exercise_name = new_log.exercise.name
        return new_log

    def get_logs_by_exercise(self, user_id: uuid.UUID, exercise_id: int) -> List[ActivityLog]:
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
                joinedload(ActivityLog.workout_session).joinedload(WorkoutSession.template)
            )
            .order_by(ActivityLog.timestamp.desc())
            .all()
        )

        self._enrich_performance_data(logs)

        for log in logs:
            log.exercise_name = log.exercise.name
            if log.workout_session:
                log.workout_session_name = (
                    log.workout_session.template.name
                    if log.workout_session.template
                    else "Personal Workout"
                )
        return logs

    def update_log(self, log_id: int, user_id: uuid.UUID, update_data: dict) -> Optional[ActivityLog]:
        db_log = self.db.query(ActivityLog).filter(
            ActivityLog.id == log_id,
            ActivityLog.user_id == user_id
        ).first()

        if not db_log:
            return None

        for key, value in update_data.items():
            if key == "performance_data" and isinstance(value, list):
                # Ensure only ID and Value are stored in JSONB
                processed_list = [
                    {"parameter_id": e.parameter_id if hasattr(e, "parameter_id") else e["parameter_id"],
                     "value": e.value if hasattr(e, "value") else e["value"]}
                    for e in value
                ]
                setattr(db_log, key, processed_list)
            else:
                setattr(db_log, key, value)

        self.db.commit()
        self.db.refresh(db_log)

        self._enrich_performance_data([db_log])
        db_log.exercise_name = db_log.exercise.name
        return db_log

    def delete_log(self, log_id: int, user_id: uuid.UUID) -> bool:
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
    service = ActivityLogService(db)
    return service.create_log(current_user.id, data)


@router.get("/{exercise_id}", response_model=List[ActivityLogOut])
async def get_activity_history(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActivityLogService(db)
    return service.get_logs_by_exercise(current_user.id, exercise_id)


@router.patch("/{log_id}", response_model=ActivityLogOut)
async def update_activity_entry(
        log_id: int,
        log_update: ActivityLogUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
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
    service = ActivityLogService(db)
    if not service.delete_log(log_id, current_user.id):
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")
    return {"message": "Log entry deleted successfully"}