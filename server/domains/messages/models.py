import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Text, Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Model ---

class Message(Base):
    """
    SQLAlchemy model representing the chat messaging and notification announcement matrix.
    """
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), nullable=False)  # 'general' or 'personal'
    is_main = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    group = relationship("Group")


# --- Pydantic Schemas ---

class MessageCreate(BaseModel):
    """Schema for recording and broadcasting a new payload message string."""
    content: str
    message_type: str
    recipient_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
    is_main: bool = False


class MessageUpdate(BaseModel):
    """Schema for partially modifying an existing message record thread."""
    content: Optional[str] = None
    message_type: Optional[str] = None


class MessageOut(BaseModel):
    """Output serialization matrix enriched with structural platform timestamps."""
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: Optional[uuid.UUID]
    group_id: Optional[uuid.UUID]
    content: str
    message_type: str
    is_main: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)