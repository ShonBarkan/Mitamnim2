import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


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
