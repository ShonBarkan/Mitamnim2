import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, Text, ForeignKey, Double, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base


# --- 1. SQLAlchemy Models (Database) ---

class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Required: Added user_id to identify which user performed the exercise
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    session_id = Column(UUID(as_uuid=True), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=True)
    exercise_id = Column(Integer, nullable=False)
    exercise_name = Column(Text, nullable=False)
    sets = Column(Integer, default=1)
    # Changed from datetime.utcnow to datetime.now for local Israel time
    created_at = Column(DateTime, default=datetime.now)

    session = relationship("WorkoutSession", back_populates="logs")
    params = relationship("ExerciseLogParam", back_populates="log", cascade="all, delete-orphan")


class ExerciseLogParam(Base):
    __tablename__ = "exercise_log_params"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    log_id = Column(UUID(as_uuid=True), ForeignKey("exercise_logs.id", ondelete="CASCADE"), nullable=False)
    parameter_name = Column(Text, nullable=False)
    parameter_unit = Column(Text, nullable=False)
    value = Column(Double, nullable=False)

    log = relationship("ExerciseLog", back_populates="params")


# --- 2. Pydantic Schemas (API Communication) ---

class LogParamSchema(BaseModel):
    parameter_name: str
    parameter_unit: str
    value: float


class ExerciseLogCreate(BaseModel):
    user_id: uuid.UUID
    session_id: Optional[uuid.UUID] = None
    exercise_id: int
    exercise_name: str
    sets: int
    params: List[LogParamSchema]


class ExerciseLogUpdate(BaseModel):
    sets: Optional[int] = None
    created_at: Optional[datetime] = None  # Added to allow updating the log time
    params: Optional[List[LogParamSchema]] = None


class LogParamOut(LogParamSchema):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class ExerciseLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    session_id: Optional[uuid.UUID]
    exercise_id: int
    exercise_name: str
    sets: int
    created_at: datetime
    params: List[LogParamOut]
    model_config = ConfigDict(from_attributes=True)