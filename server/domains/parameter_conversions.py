import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session, relationship
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User

# --- Database Model ---

class ParameterConversion(Base):
    """
    SQLAlchemy model for converting a raw parameter to a derived metric.
    """
    __tablename__ = "parameter_conversions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    source_parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    target_name = Column(String, nullable=False)
    multiplier = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    aggregation_strategy = Column(String, default="sum")
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Pydantic Schemas ---

class ConversionBase(BaseModel):
    source_parameter_id: int
    target_name: str
    multiplier: float
    unit: str
    aggregation_strategy: str = "sum"

class ConversionCreate(ConversionBase):
    pass

class ConversionOut(ConversionBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- ParameterConversionService ---

class ParameterConversionService:
    def __init__(self, db: Session):
        self.db = db

    def get_group_conversions(self, group_id: uuid.UUID) -> List[ParameterConversion]:
        return self.db.query(ParameterConversion).filter(ParameterConversion.group_id == group_id).all()

    def create_conversion(self, data: ConversionCreate, group_id: uuid.UUID) -> ParameterConversion:
        new_conv = ParameterConversion(group_id=group_id, **data.model_dump())
        self.db.add(new_conv)
        self.db.commit()
        self.db.refresh(new_conv)
        return new_conv

    def delete_conversion(self, conv_id: int, group_id: uuid.UUID):
        db_conv = self.db.query(ParameterConversion).filter(
            ParameterConversion.id == conv_id,
            ParameterConversion.group_id == group_id
        ).first()
        if db_conv:
            self.db.delete(db_conv)
            self.db.commit()

# --- Router Setup ---

router = APIRouter(prefix="/parameter-conversions", tags=["Parameter Conversions"])

@router.get("/", response_model=List[ConversionOut])
async def list_conversions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ParameterConversionService(db).get_group_conversions(current_user.group_id)

@router.post("/", response_model=ConversionOut)
async def create_conversion(data: ConversionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return ParameterConversionService(db).create_conversion(data, current_user.group_id)