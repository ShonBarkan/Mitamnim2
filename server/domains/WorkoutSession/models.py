import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base


# --- SQLAlchemy Database Model ---
class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # template_id יכול להיות ריק במקרה של אימון "חופשי" (Freestyle)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)

    name = Column(Text, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)

    # Relationship ללוגים (מאפשר לנו לשלוף את כל התרגילים של סשן בקלות)
    # נגדיר את הקשר ל-ExerciseLog שנמצא בדומיין אחר במידת הצורך
    logs = relationship("ExerciseLog", back_populates="session", cascade="all, delete-orphan")


# --- Pydantic Schemas for CRUD ---

# יצירת אימון (Create)
class SessionCreate(BaseModel):
    template_id: Optional[uuid.UUID] = None
    name: str
    note: Optional[str] = None


# עדכון אימון (Update - למשל סיום אימון או עדכון הערות)
class SessionUpdate(BaseModel):
    note: Optional[str] = None
    finished_at: Optional[datetime] = None


# הצגת אימון (Read - בשימוש ב-GET)
class SessionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    template_id: Optional[uuid.UUID]
    name: str
    started_at: datetime
    finished_at: Optional[datetime]
    note: Optional[str]

    model_config = ConfigDict(from_attributes=True)