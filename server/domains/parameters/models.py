import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, model_validator, Field
from sqlalchemy import Column, Integer, ForeignKey, Boolean, Float, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base


# --- DATABASE MODELS ---

class Parameter(Base):
    """
    SQLAlchemy model representing a measurement parameter.
    Maintained safely to preserve strict 1:1 structural alignment with the physical PostgreSQL schema.
    """
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    unit = Column(Text, nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    aggregation_strategy = Column(Text, default="sum", nullable=False)

    # --- Virtual Parameter Configuration ---
    is_virtual = Column(Boolean, default=False, nullable=False)

    # Supported structural system tokens: 'conversion', 'sum', 'subtract', 'multiply', 'divide', 'percentage'
    calculation_type = Column(Text, nullable=True)

    # Ordered list mapping source database identity parameters used for downstream calculated tracking
    source_parameter_ids = Column(ARRAY(Integer), nullable=True)

    # Factor used for conversion math rules or as a baseline mathematical constant
    multiplier = Column(Float, default=1.0, nullable=False)


# --- PYDANTIC SCHEMAS ---

class ParameterBase(BaseModel):
    """Base schema sharing baseline metadata properties across functional entities."""
    name: str
    unit: str
    aggregation_strategy: str = "sum"
    is_virtual: bool = False
    calculation_type: Optional[str] = None
    source_parameter_ids: Optional[List[int]] = None
    multiplier: float = 1.0


class ParameterCreate(ParameterBase):
    """
    Schema handling incoming client registration validation rules.
    Injects robust schema structure sanitation constraints to prevent out-of-bounds formula states.
    """

    @model_validator(mode="before")
    @classmethod
    def validate_and_sanitize_parameter_type(cls, data: dict) -> dict:
        """
        Validates incoming data frames based on the three explicit concrete parameter definitions:
        1. Regular Parameter (Raw)
        2. Conversion Parameter (Single source multiplied by factor)
        3. Parameter Combination (Two variant source IDs joined by an operator)
        """
        is_virtual = data.get("is_virtual", False)
        calc_type = data.get("calculation_type")
        sources = data.get("source_parameter_ids", [])

        # Sanitize array tracking elements to clean out any legacy empty workspace data
        if sources is None:
            sources = []
        sources = [int(sid) for sid in sources if sid != "" and sid is not None]

        if not is_virtual:
            # Type 1: Regular parameter constraints validation enforcement
            data["calculation_type"] = None
            data["source_parameter_ids"] = None
            data["multiplier"] = 1.0
            return data

        # Process virtual calculation pipelines constraints validation tracking rules
        if calc_type == "conversion":
            # Type 2: Direct multiplier conversion layout parameters alignment
            if len(sources) != 1:
                raise ValueError("Conversion parameter logic requires exactly one source parameter ID reference.")
            data["source_parameter_ids"] = sources
            data["multiplier"] = float(data.get("multiplier") or 1.0)
        else:
            # Type 3: Dual configuration parameter combination pipeline rules tracking
            allowed_operators = {"sum", "subtract", "multiply", "divide", "percentage"}
            if calc_type not in allowed_operators:
                raise ValueError(
                    f"Combination formulas must match one of the authorized system operators: {allowed_operators}")
            if len(sources) != 2:
                raise ValueError(
                    "Parameter combinations require exactly two baseline source parameter ID nodes assigned.")
            data["source_parameter_ids"] = sources
            data["multiplier"] = float(data.get("multiplier") or 1.0)

        return data


class ParameterUpdate(BaseModel):
    """Schema for handling discrete mutations on active parameter database rows."""
    name: Optional[str] = None
    unit: Optional[str] = None
    aggregation_strategy: Optional[str] = None
    is_virtual: Optional[bool] = None
    calculation_type: Optional[str] = None
    source_parameter_ids: Optional[List[int]] = None
    multiplier: Optional[float] = None


class ParameterOut(ParameterBase):
    """Structured data payload model returned safely back out into the client runtime context."""
    id: int
    group_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)