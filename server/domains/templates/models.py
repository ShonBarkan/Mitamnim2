import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Double, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

# --- ASSOCIATION TABLES ---

class TemplateUserAssignment(Base):
    __tablename__ = "template_user_assignments"
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

# Many-to-Many: Templates <-> Tags
template_tags_map = Table(
    "template_tags_map",
    Base.metadata,
    Column("template_id", UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

# --- DATABASE MODELS ---

class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    estimated_duration = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")
    assigned_users = relationship("User", secondary="template_user_assignments")
    tags = relationship("Tag", secondary=template_tags_map)

class TemplateExercise(Base):
    __tablename__ = "template_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    sets = Column(Integer, default=3)

    # Relationships
    template = relationship("WorkoutTemplate", back_populates="exercises")
    parameters = relationship("TemplateExerciseParam", cascade="all, delete-orphan")

class TemplateExerciseParam(Base):
    __tablename__ = "template_exercise_params"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_exercise_id = Column(UUID(as_uuid=True), ForeignKey("template_exercises.id", ondelete="CASCADE"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    default_value = Column(Double, nullable=False)

# --- SCHEMAS ---

class TemplateExerciseParamOut(BaseModel):
    parameter_id: int
    default_value: float
    model_config = ConfigDict(from_attributes=True)

class TemplateExerciseOut(BaseModel):
    exercise_id: int
    position: int
    sets: int
    parameters: List[TemplateExerciseParamOut]
    model_config = ConfigDict(from_attributes=True)

class WorkoutTemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    estimated_duration: int
    exercises: List[TemplateExerciseOut]
    tag_ids: List[int] = []
    model_config = ConfigDict(from_attributes=True)

class WorkoutTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    estimated_duration: int
    exercises: List[TemplateExerciseOut]
    assigned_user_ids: List[uuid.UUID] = []
    tag_ids: List[int] = []