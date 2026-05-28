import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base

# --- DATABASE MODEL ---

class Group(Base):
    """
    SQLAlchemy model representing a Training Group context.
    Groups serve as the primary organizational unit for isolated user boundaries.
    """
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    group_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relational connection back-reference tracking pool
    users = relationship("User", back_populates="group")


# --- PYDANTIC SCHEMAS ---

class GroupBase(BaseModel):
    """Base schema for Group structural configuration fields payload data."""
    name: str
    group_image: Optional[str] = None


class GroupCreate(GroupBase):
    """Schema optimized for recording and spawning new system group instances."""
    pass


class GroupUpdate(BaseModel):
    """Schema optimized for parsing structural modifications across group nodes."""
    name: Optional[str] = None
    group_image: Optional[str] = None


class GroupOut(GroupBase):
    """Output schema enriched with server metadata properties used by client grids."""
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)