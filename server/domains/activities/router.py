from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import ActivityLogOut, ActivityLogCreate, ActivityLogUpdate
from .service import ActivityLogService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.post("", response_model=ActivityLogOut, status_code=status.HTTP_201_CREATED)
async def create_activity_log(
        data: ActivityLogCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActivityLogService(db)
    return service.create_log(current_user.id, data)


@router.get("/{exercise_id}", response_model=List[ActivityLogOut])
async def get_activity_history(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActivityLogService(db)
    return service.get_logs_by_exercise(current_user.id, exercise_id)


@router.patch("/{log_id}", response_model=ActivityLogOut)
async def update_activity_entry(
        log_id: int,
        log_update: ActivityLogUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActivityLogService(db)
    update_dict = log_update.model_dump(exclude_unset=True)
    updated_log = service.update_log(log_id, current_user.id, update_dict)

    if not updated_log:
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")
    return updated_log


@router.delete("/{log_id}")
async def delete_activity_entry(
        log_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActivityLogService(db)
    if not service.delete_log(log_id, current_user.id):
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")
    return {"message": "Log entry deleted successfully"}
