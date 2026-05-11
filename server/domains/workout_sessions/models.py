import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, field_validator

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
    start_time: datetime  # ISO 8601 string from frontend (e.g., "2024-05-11T10:30:00Z")
    workout_summary: Optional[str] = None
    actual_duration: Optional[str] = None
    performed_exercises: List[PerformedExerciseSchema]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "template_id": 1,
                "start_time": "2024-05-11T10:30:00Z",
                "workout_summary": "Good session",
                "actual_duration": "45 min",
                "performed_exercises": []
            }
        }
    )

    @field_validator("start_time", mode="before")
    @classmethod
    def validate_start_time(cls, v):
        """Ensure start_time is a proper datetime, converting from ISO string if needed."""
        if isinstance(v, str):
            # Parse ISO 8601 string
            try:
                dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
                return dt
            except ValueError:
                raise ValueError(f"Invalid datetime format: {v}. Expected ISO 8601 format.")
        elif isinstance(v, datetime):
            return v
        else:
            raise ValueError(f"start_time must be a datetime or ISO string, got {type(v)}")


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
