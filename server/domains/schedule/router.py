from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import UUID

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger

# Import models instead of schemas
from . import models, service

router = APIRouter(prefix="/schedule", tags=["Schedule Management"])


def verify_access(current_user: User, target_user_id: UUID, db: Session):
    if current_user.id == target_user_id:
        return True

    if current_user.role in ["trainer", "admin"]:
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if target_user and target_user.group_id == current_user.group_id:
            return True

    logger.warning(f"Unauthorized schedule access attempt by user: {current_user.id} for target: {target_user_id}")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this schedule")


@router.get("/{user_id}", response_model=List[models.ScheduleEventResponse])
def get_schedule(
        user_id: UUID,
        start_date: datetime = Query(...),
        end_date: datetime = Query(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    verify_access(current_user, user_id, db)
    return service.get_user_schedule(db, user_id, start_date, end_date)


@router.post("", response_model=models.ScheduleEventActionResponse)
def create_schedule_event(
        event_in: models.ScheduleEventCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    verify_access(current_user, event_in.user_id, db)
    target_user = db.query(User).filter(User.id == event_in.user_id).first()

    event, has_overlap = service.create_event(db, event_in, target_user.group_id)
    return {"success": True, "has_overlap": has_overlap, "event": event}


@router.post("/group/{group_id}", response_model=models.GroupEventSummary)
def create_group_schedule_event(
        group_id: UUID,
        event_in: models.ScheduleEventBase,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["trainer", "admin"] or current_user.group_id != group_id:
        logger.warning(f"Unauthorized group schedule creation attempt by user: {current_user.id} for group: {group_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create group events")

    total_created, has_overlap = service.create_group_events(db, group_id, event_in)
    return {"success": True, "total_created": total_created, "has_overlap": has_overlap}


@router.put("/{event_id}", response_model=models.ScheduleEventActionResponse)
def update_schedule_event(
        event_id: UUID,
        event_in: models.ScheduleEventUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_event = db.query(service.ScheduleEvent).filter(service.ScheduleEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    verify_access(current_user, db_event.user_id, db)

    event, has_overlap = service.update_event(db, event_id, event_in)
    return {"success": True, "has_overlap": has_overlap, "event": event}


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_event(
        event_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_event = db.query(service.ScheduleEvent).filter(service.ScheduleEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    verify_access(current_user, db_event.user_id, db)
    service.delete_event(db, event_id)