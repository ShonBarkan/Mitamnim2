from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status

from domains.users.models import User

# Importing both the DB model and the Pydantic schemas from the unified models.py
from .models import (
    ScheduleEvent,
    ScheduleEventCreate,
    ScheduleEventUpdate,
    ScheduleEventBase
)


def check_overlap(db: Session, user_id: UUID, start_time: datetime, end_time: datetime,
                  exclude_event_id: UUID = None) -> bool:
    query = db.query(ScheduleEvent).filter(
        ScheduleEvent.user_id == user_id,
        ScheduleEvent.start_time < end_time,
        ScheduleEvent.end_time > start_time
    )
    if exclude_event_id:
        query = query.filter(ScheduleEvent.id != exclude_event_id)
    return db.query(query.exists()).scalar()


def get_user_schedule(db: Session, user_id: UUID, start_date: datetime, end_date: datetime) -> List[ScheduleEvent]:
    return db.query(ScheduleEvent).filter(
        ScheduleEvent.user_id == user_id,
        ScheduleEvent.start_time >= start_date,
        ScheduleEvent.start_time <= end_date
    ).all()


def create_event(db: Session, event_data: ScheduleEventCreate, group_id: UUID) -> Tuple[ScheduleEvent, bool]:
    has_overlap = check_overlap(db, event_data.user_id, event_data.start_time, event_data.end_time)

    db_event = ScheduleEvent(
        **event_data.model_dump(),
        group_id=group_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return db_event, has_overlap


def create_group_events(db: Session, group_id: UUID, event_data: ScheduleEventBase) -> Tuple[int, bool]:
    users_in_group = db.query(User).filter(User.group_id == group_id).all()
    if not users_in_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found in this group")

    any_overlap = False
    events_to_create = []

    for user in users_in_group:
        if check_overlap(db, user.id, event_data.start_time, event_data.end_time):
            any_overlap = True

        new_event = ScheduleEvent(
            **event_data.model_dump(),
            user_id=user.id,
            group_id=group_id
        )
        events_to_create.append(new_event)

    db.add_all(events_to_create)
    db.commit()

    return len(events_to_create), any_overlap


def update_event(db: Session, event_id: UUID, event_data: ScheduleEventUpdate) -> Tuple[ScheduleEvent, bool]:
    db_event = db.query(ScheduleEvent).filter(ScheduleEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    has_overlap = check_overlap(db, db_event.user_id, event_data.start_time, event_data.end_time,
                                exclude_event_id=event_id)

    for key, value in event_data.model_dump(exclude_unset=True).items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)
    return db_event, has_overlap


def delete_event(db: Session, event_id: UUID):
    db_event = db.query(ScheduleEvent).filter(ScheduleEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    db.delete(db_event)
    db.commit()