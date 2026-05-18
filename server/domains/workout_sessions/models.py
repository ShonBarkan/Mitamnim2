import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base

# --- DATABASE MODELS ---

class WorkoutSession(Base):
    """Header record representing a fully executed and finalized workout session profile."""
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    workout_summary = Column(Text, nullable=True)
    actual_duration = Column(Text, nullable=True)

    # Relational branches traversing nested performance tracking nodes
    performed_sets = relationship("PerformedSet", back_populates="workout_session", cascade="all, delete-orphan")
    user = relationship("User")
    template = relationship("WorkoutTemplate")


class PerformedSet(Base):
    """
    Represents a single distinct set executed for an exercise during a session.
    Explicitly maps Pythonic attributes to physical PostgreSQL column names.
    """
    __tablename__ = "performed_sets"

    id = Column(Integer, primary_key=True, index=True)

    # Mapped to physical column 'session_id' in PostgreSQL while keeping property name clean
    workout_session_id = Column("session_id", Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)

    exercise_id = Column(Integer, ForeignKey("group_exercise_registry.id", ondelete="CASCADE"), nullable=False)

    # Mapped to physical column 'set_num' in PostgreSQL while keeping property name clean
    set_number = Column("set_num", Integer, nullable=False)

    workout_session = relationship("WorkoutSession", back_populates="performed_sets")
    exercise = relationship("GroupExerciseRegistry")
    set_values = relationship("PerformedSetValue", back_populates="performed_set", cascade="all, delete-orphan")


class PerformedSetValue(Base):
    """
    Holds the specific, isolated metric log value produced during a single performed set.
    Utilizes a composite primary key layout matching the physical database schema architecture.
    """
    __tablename__ = "performed_set_values"

    # Adjusted to reflect the actual composite primary keys instead of a missing auto-increment column
    performed_set_id = Column(Integer, ForeignKey("performed_sets.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    value = Column(Text, nullable=False)

    performed_set = relationship("PerformedSet", back_populates="set_values")
    parameter = relationship("Parameter")


# --- PYDANTIC SCHEMAS ---

class ParamValuePayload(BaseModel):
    parameter_id: int
    value: str


class SetPerformancePayload(BaseModel):
    set_number: int
    metrics: List[ParamValuePayload]


class ExercisePerformancePayload(BaseModel):
    exercise_id: int
    sets: List[SetPerformancePayload]


class WorkoutSessionFinish(BaseModel):
    template_id: Optional[int] = None
    start_time: datetime
    workout_summary: Optional[str] = None
    actual_duration: Optional[str] = None
    performed_exercises: List[ExercisePerformancePayload]


class WorkoutSessionOut(BaseModel):
    id: int
    user_id: uuid.UUID
    template_id: Optional[int]
    start_time: datetime
    end_time: datetime
    workout_summary: Optional[str]
    actual_duration: Optional[str]

    model_config = ConfigDict(from_attributes=True)