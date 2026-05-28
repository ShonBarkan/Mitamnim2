import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


# --- DATABASE MODELS ---

class Tag(Base):
    """
    SQLAlchemy model representing a group-isolated metadata tag.
    Maps directly 1:1 to the revised physical PostgreSQL 'tags' table structure layout.
    """
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    color = Column(Text, nullable=False)

    # FIXED: Isolated per group partition perimeter to ensure structural multi-tenancy
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)


# --- PYDANTIC SCHEMAS ---

class TagBase(BaseModel):
    """Base Pydantic schema sharing generalized structural tag metadata parameters."""
    name: str
    color: str


class TagCreate(TagBase):
    """
    Schema applied when validating incoming client registration payloads for new tags.
    Note: group_id is excluded from the input body as it is forcefully injected via session context tokens.
    """
    pass


class TagUpdate(BaseModel):
    """Schema applied during data modification cycles, enabling partial field mutation updates."""
    name: Optional[str] = None
    color: Optional[str] = None


class TagOut(TagBase):
    """Structured tracking payload wrapper returned safely back out into the frontend client scope."""
    id: int
    group_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)