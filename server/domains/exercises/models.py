import uuid
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Models ---

class ExerciseTree(Base):
    """
    SQLAlchemy model representing a node in the exercise hierarchy.
    Acts as a self-referencing tree structure.
    """
    __tablename__ = "exercise_tree"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    active_params = relationship("ActiveParam", back_populates="exercise", cascade="all, delete-orphan")


# --- Pydantic Schemas ---

class ExerciseBase(BaseModel):
    """Base schema for Exercise Tree data."""
    name: str
    parent_id: Optional[int] = None


class ExerciseCreate(ExerciseBase):
    """Schema for creating a new exercise node."""
    pass


class ExerciseUpdate(BaseModel):
    """Schema for updating an existing exercise node."""
    name: Optional[str] = None
    parent_id: Optional[int] = None


class ExerciseOut(ExerciseBase):
    """Output schema for exercises including recursive metadata."""
    id: int
    group_id: uuid.UUID
    has_children: bool = False
    has_params: bool = False
    # List of parameter IDs associated with this node and its descendants
    active_parameter_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class ExerciseBatchRequest(BaseModel):
    """Schema for requesting multiple exercises by their IDs."""
    exercise_ids: List[int]
