import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User


# --- Database Model ---
# (Keeping your existing model as is)
class StatsDashboardConfig(Base):
    __tablename__ = "stats_dashboard_config"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="SET NULL"), nullable=True)
    ranking_direction = Column(String, default="desc")
    aggregation_override = Column(String, nullable=True)
    time_frame = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Pydantic Schemas ---

class DashboardConfigBase(BaseModel):
    exercise_id: int
    parameter_id: Optional[int] = None
    ranking_direction: str = "desc"
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: int = 0
    is_public: bool = True


class DashboardConfigCreate(DashboardConfigBase):
    pass


# Added Update Schema with all fields optional
class DashboardConfigUpdate(BaseModel):
    exercise_id: Optional[int] = None
    parameter_id: Optional[int] = None
    ranking_direction: Optional[str] = None
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: Optional[int] = None
    is_public: Optional[bool] = None


class DashboardConfigOut(DashboardConfigBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- DashboardService (Business Logic) ---

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_group_configs(self, group_id: uuid.UUID) -> List[StatsDashboardConfig]:
        return self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.group_id == group_id
        ).order_by(StatsDashboardConfig.display_order.asc()).all()

    def create_config(self, data: DashboardConfigCreate, group_id: uuid.UUID) -> StatsDashboardConfig:
        # Calculate next display_order automatically
        max_order = self.db.query(func.max(StatsDashboardConfig.display_order)).filter(
            StatsDashboardConfig.group_id == group_id
        ).scalar()

        # If no items exist, start at 0, otherwise max + 1
        next_order = (max_order + 1) if max_order is not None else 0

        new_config = StatsDashboardConfig(
            group_id=group_id,
            display_order=next_order,
            **data.model_dump(exclude={'display_order'})
        )
        self.db.add(new_config)
        self.db.commit()
        self.db.refresh(new_config)
        return new_config

    def update_config(self, config_id: int, group_id: uuid.UUID, data: DashboardConfigUpdate) -> StatsDashboardConfig:
        """Updates specific fields of a dashboard config."""
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()

        if not db_config:
            raise HTTPException(status_code=404, detail="Config not found")

        # Update only the fields provided in the request
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_config, key, value)

        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def delete_config(self, config_id: int, group_id: uuid.UUID):
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()
        if not db_config:
            raise HTTPException(status_code=404, detail="Config not found")
        self.db.delete(db_config)
        self.db.commit()


# --- Router Setup ---

router = APIRouter(prefix="/dashboard-config", tags=["Dashboard Config"])


@router.get("/", response_model=List[DashboardConfigOut])
async def list_dashboard_configs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DashboardService(db)
    return service.get_group_configs(current_user.group_id)


@router.post("/", response_model=DashboardConfigOut)
async def add_dashboard_item(data: DashboardConfigCreate, db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Only trainers can manage the dashboard")
    service = DashboardService(db)
    return service.create_config(data, current_user.group_id)


# Added PATCH endpoint for updates (Drag and Drop support)
@router.patch("/{config_id}/", response_model=DashboardConfigOut)
async def update_dashboard_item(
        config_id: int,
        data: DashboardConfigUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing dashboard item, used for reordering or editing logic."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    service = DashboardService(db)
    return service.update_config(config_id, current_user.group_id, data)


@router.delete("/{config_id}/")
async def remove_dashboard_item(config_id: int, db: Session = Depends(get_db),
                                current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    service = DashboardService(db)
    service.delete_config(config_id, current_user.group_id)
    return {"message": "Removed from dashboard"}