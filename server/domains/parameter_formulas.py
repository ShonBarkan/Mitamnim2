import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Session, relationship
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User

# --- Database Model ---

class ParameterFormula(Base):
    """
    SQLAlchemy model representing a calculation recipe for complex metrics.
    """
    __tablename__ = "parameter_formulas"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    target_name = Column(String, nullable=False)
    operation = Column(String, nullable=False) # 'multiply', 'add'
    source_parameter_ids = Column(JSONB, nullable=False)
    include_sources = Column(JSONB, nullable=True)
    stats_source_id = Column(Integer, ForeignKey("parameters.id", ondelete="SET NULL"), nullable=True)
    unit = Column(String, nullable=True)
    aggregation_strategy = Column(String, default="sum")
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Pydantic Schemas ---

class FormulaBase(BaseModel):
    target_name: str
    operation: str
    source_parameter_ids: List[int]
    include_sources: Optional[List[int]] = None
    stats_source_id: Optional[int] = None
    unit: Optional[str] = None
    aggregation_strategy: str = "sum"

class FormulaCreate(FormulaBase):
    pass

class FormulaOut(FormulaBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- ParameterFormulaService ---

class ParameterFormulaService:
    def __init__(self, db: Session):
        self.db = db

    def get_group_formulas(self, group_id: uuid.UUID) -> List[ParameterFormula]:
        return self.db.query(ParameterFormula).filter(ParameterFormula.group_id == group_id).all()

    def create_formula(self, data: FormulaCreate, group_id: uuid.UUID) -> ParameterFormula:
        new_formula = ParameterFormula(group_id=group_id, **data.model_dump())
        self.db.add(new_formula)
        self.db.commit()
        self.db.refresh(new_formula)
        return new_formula

# --- Router Setup ---

router = APIRouter(prefix="/parameter-formulas", tags=["Parameter Formulas"])

@router.get("/", response_model=List[FormulaOut])
async def list_formulas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ParameterFormulaService(db).get_group_formulas(current_user.group_id)

@router.post("/", response_model=FormulaOut)
async def create_formula(data: FormulaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return ParameterFormulaService(db).create_formula(data, current_user.group_id)