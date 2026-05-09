from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import DashboardConfigOut, DashboardConfigCreate, DashboardConfigUpdate
from .service import DashboardService
from ..users.models import User


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
    result = service.update_config(config_id, current_user.group_id, data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard configuration not found or access denied"
        )
    return result


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
