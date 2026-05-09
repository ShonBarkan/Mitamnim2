import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Model ---

class Group(Base):
    """
    SQLAlchemy model representing a Training Group.
    Groups serve as the primary organizational unit for users and data isolation.
    """
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    group_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to users (referenced as a string to avoid circular imports)
    users = relationship("User", back_populates="group")


# --- Pydantic Schemas ---

class GroupBase(BaseModel):
    """Base schema for Group data, shared across creation and updates."""
    name: str
    group_image: Optional[str] = None


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupUpdate(BaseModel):
    """Schema for partially updating an existing group."""
    name: Optional[str] = None
    group_image: Optional[str] = None


class GroupOut(GroupBase):
    """Schema for outgoing group data, including generated metadata."""
    id: uuid.UUID
    created_at: datetime

    # Pydantic V2 configuration for ORM compatibility
    model_config = ConfigDict(from_attributes=True)
