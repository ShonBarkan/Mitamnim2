import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session, relationship
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User


# --- Database Model ---

class StatsDashboardConfig(Base):
    """
    SQLAlchemy model for group-specific dashboard visualization settings.
    Determines which exercises and parameters appear on the public leaderboard.
    """
    __tablename__ = "stats_dashboard_config"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="SET NULL"), nullable=True)
    ranking_direction = Column(String, default="desc")  # 'desc' for high scores, 'asc' for speed/time
    aggregation_override = Column(String, nullable=True)  # Optional: 'sum', 'max', 'avg'
    time_frame = Column(String, nullable=True)  # Optional: 'all_time', 'monthly', 'weekly'
    display_order = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group")
    exercise = relationship("ExerciseTree")
    parameter = relationship("Parameter")


# --- Pydantic Schemas ---

class DashboardConfigBase(BaseModel):
    """Shared fields for dashboard configuration."""
    exercise_id: int
    parameter_id: Optional[int] = None
    ranking_direction: str = "desc"
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: int = 0
    is_public: bool = True


class DashboardConfigCreate(DashboardConfigBase):
    """Schema for creating a new dashboard entry."""
    pass


class DashboardConfigUpdate(BaseModel):
    """Schema for partial updates (e.g., drag-and-drop reordering or field edits)."""
    exercise_id: Optional[int] = None
    parameter_id: Optional[int] = None
    ranking_direction: Optional[str] = None
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: Optional[int] = None
    is_public: Optional[bool] = None


class DashboardConfigOut(DashboardConfigBase):
    """Output schema including system-generated metadata."""
    id: int
    group_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- DashboardService (Business Logic) ---

class DashboardService:
    """
    Service handling the display logic and ordering of dashboard items.
    Optimized for group-based multi-tenancy.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_configs(self, group_id: uuid.UUID) -> List[StatsDashboardConfig]:
        """Retrieves all dashboard settings for a group, sorted by display order."""
        return (
            self.db.query(StatsDashboardConfig)
            .filter(StatsDashboardConfig.group_id == group_id)
            .order_by(StatsDashboardConfig.display_order.asc())
            .all()
        )

    def create_config(self, data: DashboardConfigCreate, group_id: uuid.UUID) -> StatsDashboardConfig:
        """Adds a new item to the dashboard with automatic order calculation."""
        # Calculate the next available display order index for this specific group
        max_order = self.db.query(func.max(StatsDashboardConfig.display_order)).filter(
            StatsDashboardConfig.group_id == group_id
        ).scalar()

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
        """Updates specific fields of a configuration entry after verifying ownership."""
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()

        if not db_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dashboard configuration not found or access denied"
            )

        # Apply partial updates using model_dump to handle optional fields
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_config, key, value)

        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def delete_config(self, config_id: int, group_id: uuid.UUID) -> bool:
        """Removes an item from the dashboard after verifying ownership."""
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()

        if not db_config:
            return False

        self.db.delete(db_config)
        self.db.commit()
        return True


# --- Router Setup ---

router = APIRouter(prefix="/dashboard-config", tags=["Dashboard Config"])


@router.get("/", response_model=List[DashboardConfigOut])
async def list_dashboard_configs(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Lists current dashboard configurations for the user's group."""
    service = DashboardService(db)
    return service.get_group_configs(current_user.group_id)


@router.post("/", response_model=DashboardConfigOut)
async def add_dashboard_item(
        data: DashboardConfigCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Registers a new dashboard display rule. Restricted to Trainers and Admins."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Sufficient permissions required to manage dashboard"
        )

    service = DashboardService(db)
    return service.create_config(data, current_user.group_id)


@router.patch("/{config_id}/", response_model=DashboardConfigOut)
async def update_dashboard_item(
        config_id: int,
        data: DashboardConfigUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing dashboard item. Used for reordering or editing metrics."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Sufficient permissions required to edit dashboard items"
        )

    service = DashboardService(db)
    return service.update_config(config_id, current_user.group_id, data)


@router.delete("/{config_id}/")
async def remove_dashboard_item(
        config_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Removes an item from the dashboard display. Restricted to Trainers and Admins."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized"
        )

    service = DashboardService(db)
    if not service.delete_config(config_id, current_user.group_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config entry not found or access denied"
        )

    return {"message": "Item removed from dashboard successfully"}