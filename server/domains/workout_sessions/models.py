import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


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
