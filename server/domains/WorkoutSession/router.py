from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from .service import SessionService

# Updated imports to include the fat payload schemas for nested data
from .models import SessionCreateFat, SessionUpdate, SessionOut, SessionOutDetailed

router = APIRouter(prefix="/sessions", tags=["Workout Sessions"])

@router.post("", response_model=SessionOutDetailed, status_code=status.HTTP_201_CREATED)
async def start_session(
    data: SessionCreateFat,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SessionService(db)
    # The payload contains the entire session, logs, and parameters.
    # The service layer handles the nested transaction.
    return service.create_session(current_user.id, data.model_dump())

@router.get("", response_model=List[SessionOutDetailed])
async def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SessionService(db)
    # Returns the history with fully populated nested logs and params
    # relying on the selectinload optimization in the service.
    return service.get_user_sessions(current_user.id)

@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: uuid.UUID,
    data: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SessionService(db)
    # exclude_unset=True ensures we only update fields the user actually sent
    updated = service.update_session(session_id, current_user.id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SessionService(db)
    if not service.delete_session(session_id, current_user.id):
        raise HTTPException(status_code=404, detail="Session not found")
    return None