import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import Column, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base


# --- SQLAlchemy Database Models ---

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)
    name = Column(Text, nullable=False)

    # Updated to timezone-aware DateTime to handle frontend ISO strings correctly
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    note = Column(Text, nullable=True)

    # Relationship to ExerciseLog
    logs = relationship(
        "ExerciseLog",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


# --- Nested Pydantic Schemas for Fat Payload (Input) ---

class LogParamCreate(BaseModel):
    parameter_name: str
    parameter_unit: str
    value: float


class ExerciseLogCreate(BaseModel):
    exercise_id: int
    exercise_name: str
    sets: Optional[int] = None
    position: Optional[int] = 0
    params: List[LogParamCreate] = []


class SessionCreateFat(BaseModel):
    template_id: Optional[uuid.UUID] = None
    name: str
    started_at: datetime
    note: Optional[str] = None
    logs: List[ExerciseLogCreate] = []


# Schema for partial updates to top-level session fields
class SessionUpdate(BaseModel):
    template_id: Optional[uuid.UUID] = None
    name: Optional[str] = None
    started_at: Optional[datetime] = None
    note: Optional[str] = None


# --- Nested Pydantic Schemas for Detailed View (Output) ---

class LogParamOut(BaseModel):
    id: uuid.UUID
    parameter_name: str
    parameter_unit: str
    value: float

    model_config = ConfigDict(from_attributes=True)


class ExerciseLogOut(BaseModel):
    id: uuid.UUID
    exercise_id: int
    exercise_name: str
    sets: Optional[int]
    position: int
    created_at: datetime
    params: List[LogParamOut] = []

    model_config = ConfigDict(from_attributes=True)


class SessionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    template_id: Optional[uuid.UUID]
    name: str
    started_at: datetime
    note: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class SessionOutDetailed(SessionOut):
    logs: List[ExerciseLogOut] = []