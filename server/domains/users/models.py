import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

from db.database import Base


# --- Database Model ---

class User(Base):
    """
    SQLAlchemy model representing a User in the system.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=True)
    second_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    profile_picture = Column(Text, nullable=True)
    role = Column(String, nullable=False)  # 'admin', 'trainer', 'trainee'
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)

    # Relationships
    group = relationship("Group", back_populates="users")


# --- Pydantic Schemas ---

class UserBase(BaseModel):
    """Base schema for User data."""
    username: str
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str
    group_id: Optional[uuid.UUID] = None

    @field_validator("email", "username", "first_name", "second_name", "phone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        """Converts empty strings to None to prevent validation errors."""
        return None if v == "" else v


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    username: Optional[str] = None
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    group_id: Optional[uuid.UUID] = None

    @field_validator("email", "username", "first_name", "second_name", "phone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        """Converts empty strings to None to prevent validation errors."""
        return None if v == "" else v


class UserOut(UserBase):
    """Schema for outgoing user data."""
    id: uuid.UUID
    created_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
