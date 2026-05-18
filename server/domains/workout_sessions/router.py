from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from middlewares.auth import get_current_user
from domains.workout_sessions.models import WorkoutSessionFinish, WorkoutSessionOut
from domains.workout_sessions.service import WorkoutSessionService

router = APIRouter(prefix="/workout-sessions", tags=["Workout Sessions Tracker"])

@router.get("", response_model=List[WorkoutSessionOut])
async def get_my_workout_history(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetches historic logs of all verified finalized sessions executed by current user."""
    return WorkoutSessionService.get_user_sessions(db, current_user.id)

@router.post("/finish", response_model=WorkoutSessionOut, status_code=status.HTTP_201_CREATED)
async def finish_workout_session(payload: WorkoutSessionFinish, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Unpacks structural multi-set parameters and safely logs completion vectors."""
    return WorkoutSessionService.finalize_session(db, current_user.id, payload.model_dump())