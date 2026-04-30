import uuid
from typing import List, Optional, Any

from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User


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


# --- ParameterService (Business Logic Class) ---

class ParameterService:
    """
    Service layer to handle business logic for measurement parameters.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_parameters(self, group_id: uuid.UUID) -> List[Parameter]:
        """Retrieves all parameters belonging to a specific group."""
        return self.db.query(Parameter).filter(Parameter.group_id == group_id).all()

    def get_parameter_by_id(self, param_id: int, group_id: uuid.UUID) -> Optional[Parameter]:
        """Retrieves a single parameter by ID while verifying group ownership."""
        return self.db.query(Parameter).filter(
            Parameter.id == param_id,
            Parameter.group_id == group_id
        ).first()

    def create_parameter(self, data: ParameterCreate, group_id: uuid.UUID) -> Parameter:
        """Initializes and persists a new parameter, including virtual calculation settings."""
        new_param = Parameter(
            name=data.name,
            unit=data.unit,
            aggregation_strategy=data.aggregation_strategy,
            group_id=group_id,
            is_virtual=data.is_virtual,
            calculation_type=data.calculation_type,
            source_parameter_ids=data.source_parameter_ids,
            multiplier=data.multiplier
        )
        self.db.add(new_param)
        self.db.commit()
        self.db.refresh(new_param)
        return new_param

    def update_parameter(self, db_param: Parameter, update_data: dict) -> Parameter:
        """Applies validated updates to a parameter instance."""
        for key, value in update_data.items():
            setattr(db_param, key, value)
        self.db.commit()
        self.db.refresh(db_param)
        return db_param

    def delete_parameter(self, db_param: Parameter):
        """Permanently removes a parameter record."""
        self.db.delete(db_param)
        self.db.commit()


# --- Router Setup ---

router = APIRouter(prefix="/parameters", tags=["Parameters"])


@router.get("/", response_model=List[ParameterOut])
async def list_parameters(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all measurement parameters for the current user's group."""
    service = ParameterService(db)
    return service.get_group_parameters(current_user.group_id)


@router.post("/", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
async def create_new_parameter(
        param_data: ParameterCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Defines a new measurement parameter. Restricted to admin and trainer roles."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create parameters"
        )

    service = ParameterService(db)
    return service.create_parameter(param_data, current_user.group_id)


@router.patch("/{param_id}/", response_model=ParameterOut)
async def update_existing_parameter(
        param_id: int,
        param_update: ParameterUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates parameter details. Restricted to admin and trainer roles."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(status_code=404, detail="Parameter not found or access denied")

    update_dict = param_update.model_dump(exclude_unset=True)
    return service.update_parameter(db_param, update_dict)


@router.delete("/{param_id}/")
async def remove_parameter(
        param_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a parameter definition. Restricted to admin and trainer roles."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(status_code=404, detail="Parameter not found or access denied")

    service.delete_parameter(db_param)
    return {"message": "Parameter deleted successfully"}