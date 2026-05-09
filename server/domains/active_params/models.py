import uuid
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Model ---

class ActiveParam(Base):
    """
    SQLAlchemy model representing the link between a specific exercise and its parameters.
    """
    __tablename__ = "active_params"

    id = Column(Integer, primary_key=True, index=True)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    default_value = Column(Text, nullable=True)

    # Relationships
    parameter = relationship("Parameter")
    exercise = relationship("ExerciseTree", back_populates="active_params")


# --- Pydantic Schemas ---

class ActiveParamBase(BaseModel):
    """Base schema for active parameter data."""
    parameter_id: int
    exercise_id: int
    group_id: uuid.UUID
    default_value: Optional[str] = None


class ActiveParamCreate(ActiveParamBase):
    """Schema for creating a new link."""
    pass


class ActiveParamOut(ActiveParamBase):
    """Output schema enriched with metadata for the UI."""
    id: int
    parameter_name: Optional[str] = None
    parameter_unit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ActiveParamBatchRequest(BaseModel):
    """Schema for requesting multiple active parameters by their IDs."""
    ids: Optional[List[int]] = None
