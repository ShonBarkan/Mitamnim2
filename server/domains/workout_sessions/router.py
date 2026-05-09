from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import WorkoutSessionOut, WorkoutSessionFinish
from .service import WorkoutSessionService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/workout-sessions", tags=["Workout Sessions"])


@router.post("/finish", response_model=WorkoutSessionOut)
async def finish_workout_session(
        data: WorkoutSessionFinish,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Endpoint to submit and split workout results into individual sets."""
    service = WorkoutSessionService(db)
    try:
        return service.finish_workout(current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Server Error during finish_workout: {e}")
        raise HTTPException(status_code=500, detail="שגיאה פנימית בשמירת האימון")


@router.get("/history", response_model=List[WorkoutSessionOut])
async def get_workout_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves workout history for the current user."""
    service = WorkoutSessionService(db)
    return service.get_user_history(current_user.id)
