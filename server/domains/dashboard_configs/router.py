from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from pydantic import BaseModel

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from domains.parameters.models import Parameter
from .service import DashboardConfigService
from .models import DashboardConfigCreate, DashboardConfigUpdate, DashboardConfigOut

router = APIRouter(prefix="/dashboard-configs", tags=["Dashboard Configurations"])


# Schema for Bulk Reordering
class ReorderItem(BaseModel):
    id: uuid.UUID
    position: int


# --- CRUD Endpoints ---

@router.post("", response_model=DashboardConfigOut, status_code=status.HTTP_201_CREATED)
async def create_config(
        data: DashboardConfigCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'trainer']:
        raise HTTPException(status_code=403, detail="Only trainers or admins can create configs")

    param = db.query(Parameter).filter(Parameter.id == data.parameter_id).first()
    if not param:
        raise HTTPException(status_code=404, detail="Parameter not found")

    data_dict = data.model_dump()
    data_dict['group_id'] = current_user.group_id
    data_dict['aggregation_type'] = param.aggregation_strategy.upper()

    service = DashboardConfigService(db)
    return service.create_config_from_dict(data_dict)


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_configs(
        items: List[ReorderItem],
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'trainer']:
        raise HTTPException(status_code=403, detail="Unauthorized")

    service = DashboardConfigService(db)
    # Convert Pydantic models to dicts for the service
    reorder_data = [item.model_dump() for item in items]

    if not service.reorder_configs(reorder_data):
        raise HTTPException(status_code=500, detail="Failed to reorder configs")

    return {"message": "Reordered successfully"}


@router.get("", response_model=List[DashboardConfigOut])
async def get_configs(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = DashboardConfigService(db)
    return service.get_configs(current_user.group_id)


@router.patch("/{config_id}", response_model=DashboardConfigOut)
async def update_config(
        config_id: uuid.UUID,
        data: DashboardConfigUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'trainer']:
        raise HTTPException(status_code=403, detail="Unauthorized")

    service = DashboardConfigService(db)
    updated = service.update_config(config_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Config not found")
    return updated


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(
        config_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'trainer']:
        raise HTTPException(status_code=403, detail="Unauthorized")

    service = DashboardConfigService(db)
    if not service.delete_config(config_id):
        raise HTTPException(status_code=404, detail="Config not found")
    return None