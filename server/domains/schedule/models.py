import enum
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.sql import func
from pydantic import BaseModel, ConfigDict

# Fixed import path based on your existing project structure
from db.database import Base


# --- ENUMS ---

class EventTypeEnum(str, enum.Enum):
    template = "template"
    test = "test"
    personal = "personal"
    other = "other"


# --- DATABASE MODELS ---

class ScheduleEvent(Base):
    __tablename__ = "schedule_events"

    # Using PostgresUUID to avoid collision with Python's native uuid package
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(PostgresUUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(PostgresUUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)

    title = Column(Text, nullable=False)
    event_type = Column(String, nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)

    is_recurring = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# --- PYDANTIC SCHEMAS ---

class ScheduleEventBase(BaseModel):
    title: str
    event_type: EventTypeEnum
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    template_id: Optional[uuid.UUID] = None

class ScheduleEventCreate(ScheduleEventBase):
    user_id: uuid.UUID

class ScheduleEventUpdate(ScheduleEventBase):
    pass

class ScheduleEventResponse(ScheduleEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    group_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    # Updated to Pydantic V2 config, matching your other schemas
    model_config = ConfigDict(from_attributes=True)

class ScheduleEventActionResponse(BaseModel):
    success: bool
    has_overlap: bool
    event: ScheduleEventResponse

class GroupEventSummary(BaseModel):
    success: bool
    total_created: int
    has_overlap: bool