from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

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
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves workout history for the current user or a trainee if trainer."""
    if target_user_id and current_user.role in ["admin", "trainer"]:
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user or (current_user.role == "trainer" and target_user.group_id != current_user.group_id):
            raise HTTPException(status_code=403, detail="Access denied to user workout history")
        uid = target_user_id
    else:
        uid = current_user.id
    service = WorkoutSessionService(db)
    return service.get_user_history(uid)
