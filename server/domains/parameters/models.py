import uuid
from typing import List, Optional, Any

from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Model ---

class Parameter(Base):
    """
    SQLAlchemy model representing a measurement parameter.
    Now supports virtual/calculated parameters with various mathematical operations.
    """
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    aggregation_strategy = Column(String, default="sum", nullable=False)

    # --- Virtual Parameter Configuration ---
    is_virtual = Column(Boolean, default=False, nullable=False)

    # Supported types: 'conversion', 'sum', 'subtract', 'multiply', 'divide', 'percentage'
    calculation_type = Column(String, nullable=True)

    # Ordered list of source parameter IDs used for the calculation logic
    source_parameter_ids = Column(ARRAY(Integer), nullable=True)

    # Multiplier used for conversions (e.g., pools to meters) or as a constant in formulas
    multiplier = Column(Float, default=1.0, nullable=False)


# --- Pydantic Schemas ---

class ParameterBase(BaseModel):
    """Base schema for parameter data shared across creation and updates."""
    name: str
    unit: str
    aggregation_strategy: str = "sum"
    is_virtual: bool = False
    calculation_type: Optional[str] = None
    source_parameter_ids: Optional[List[int]] = None
    multiplier: float = 1.0


class ParameterCreate(ParameterBase):
    """Schema used when creating a new parameter definition."""
    pass


class ParameterUpdate(BaseModel):
    """Schema for partial updates, allowing any field to be optional."""
    name: Optional[str] = None
    unit: Optional[str] = None
    aggregation_strategy: Optional[str] = None
    is_virtual: Optional[bool] = None
    calculation_type: Optional[str] = None
    source_parameter_ids: Optional[List[int]] = None
    multiplier: Optional[float] = None


class ParameterOut(ParameterBase):
    """Schema for data sent back to the client, including database-generated fields."""
    id: int
    group_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
