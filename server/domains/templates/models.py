import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, model_validator
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
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan",
                             order_by="TemplateExercise.position")
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

    # NEW: Direct connection to the master Exercise table for enrichment
    exercise_ref = relationship("Exercise", foreign_keys=[exercise_id])


class TemplateExerciseParam(Base):
    __tablename__ = "template_exercise_params"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_exercise_id = Column(UUID(as_uuid=True), ForeignKey("template_exercises.id", ondelete="CASCADE"),
                                  nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    default_value = Column(Double, nullable=False)

    # NEW: Direct connection to the master Parameter table for enrichment
    parameter_ref = relationship("Parameter", foreign_keys=[parameter_id])


# --- SCHEMAS FOR OUTPUT (Enriched Display) ---

class TagEnrichedOut(BaseModel):
    id: int
    name: str
    color: str
    model_config = ConfigDict(from_attributes=True)


class TemplateExerciseParamOut(BaseModel):
    parameter_id: int
    default_value: float
    name: str = ""
    unit: str = ""
    is_virtual: bool = False
    calculation_type: Optional[str] = None
    source_parameter_ids: Optional[List[int]] = None
    multiplier: Optional[float] = None

    @model_validator(mode='before')
    @classmethod
    def flatten_param(cls, data: Any) -> Any:
        # Dynamically map fields from the referenced Parameter model into a flat JSON structure
        if hasattr(data, 'parameter_ref') and data.parameter_ref:
            return {
                "parameter_id": data.parameter_id,
                "default_value": data.default_value,
                "name": data.parameter_ref.name,
                "unit": data.parameter_ref.unit,
                "is_virtual": data.parameter_ref.is_virtual,
                "calculation_type": data.parameter_ref.calculation_type,
                "source_parameter_ids": data.parameter_ref.source_parameter_ids,
                "multiplier": data.parameter_ref.multiplier
            }
        return data


class TemplateExerciseOut(BaseModel):
    exercise_id: int
    position: int
    sets: int
    name: str = ""
    parameters: List[TemplateExerciseParamOut]

    @model_validator(mode='before')
    @classmethod
    def flatten_exercise(cls, data: Any) -> Any:
        # Dynamically map the referenced Exercise name
        if hasattr(data, 'exercise_ref') and data.exercise_ref:
            return {
                "exercise_id": data.exercise_id,
                "position": data.position,
                "sets": data.sets,
                "name": data.exercise_ref.name,
                "parameters": data.parameters
            }
        return data


class WorkoutTemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    estimated_duration: int
    tags: List[TagEnrichedOut] = []  # Changed from tag_ids to fully enriched tags
    assigned_user_ids: List[uuid.UUID] = []
    exercises: List[TemplateExerciseOut]

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='before')
    @classmethod
    def process_relationships(cls, data: Any) -> Any:
        if hasattr(data, 'assigned_users'):
            # Convert assigned_users objects into a clean flat list of IDs
            setattr(data, 'assigned_user_ids', [user.id for user in data.assigned_users])
        return data


# --- SCHEMAS FOR CREATION (Lean Input) ---

class TemplateExerciseParamCreate(BaseModel):
    parameter_id: int
    default_value: float


class TemplateExerciseCreate(BaseModel):
    exercise_id: int
    position: int
    sets: int
    parameters: List[TemplateExerciseParamCreate]


class WorkoutTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    estimated_duration: int
    tag_ids: List[int] = []
    assigned_user_ids: List[uuid.UUID] = []
    exercises: List[TemplateExerciseCreate]