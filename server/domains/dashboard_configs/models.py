import uuid
from typing import Optional, Literal
from sqlalchemy import Column, Text, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base


# --- SQLAlchemy Database Model ---

class DashboardConfig(Base):
    __tablename__ = "dashboard_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    # Nullable exercise_id implies "All Exercises" scope
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=True)
    display_name = Column(Text, nullable=False)

    # Aggregation type restricted to: 'SUM', 'MAX', 'AVG'
    aggregation_type = Column(Text, nullable=False)
    is_higher_better = Column(Boolean, default=True)
    # position is used to determine display priority/order
    position = Column(Integer, default=0)

    # Relationships
    group = relationship("Group")
    parameter = relationship("Parameter")
    exercise = relationship("Exercise")


# --- Pydantic Schemas for CRUD Operations ---

# Used for creating new config records
class DashboardConfigCreate(BaseModel):
    parameter_id: int
    exercise_id: Optional[int] = None
    display_name: str
    is_higher_better: Optional[bool] = True
    # position defaults to 0, or can be set manually
    position: Optional[int] = 0
    # Optional fields injected by the backend router
    group_id: Optional[uuid.UUID] = None
    aggregation_type: Optional[Literal['SUM', 'MAX', 'AVG']] = None


# Used for updating existing config records
class DashboardConfigUpdate(BaseModel):
    display_name: Optional[str] = None
    exercise_id: Optional[int] = None
    aggregation_type: Optional[Literal['SUM', 'MAX', 'AVG']] = None
    is_higher_better: Optional[bool] = None
    position: Optional[int] = None


# Used for reading config records (Response)
class DashboardConfigOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    parameter_id: int
    exercise_id: Optional[int] = None
    display_name: str
    aggregation_type: str
    is_higher_better: bool
    position: int

    model_config = ConfigDict(from_attributes=True)


class ReorderItem(BaseModel):
    id: uuid.UUID
    position: int
