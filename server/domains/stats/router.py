import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from db.database import get_db
from middlewares.auth import get_current_user

from .models import UserOverviewStats, StatsOutput, GroupLeaderboardOutput
from .service import StatisticsEngineService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/stats", tags=["Statistics Engine"])


@router.get("/overview/", response_model=UserOverviewStats)
async def get_user_overview(
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches high-level consolidated stats for the user dashboard."""
    if target_user_id and current_user.role in ["admin", "trainer"]:
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user or (current_user.role == "trainer" and target_user.group_id != current_user.group_id):
            raise HTTPException(status_code=403, detail="Access denied to user stats")
        uid = target_user_id
    else:
        uid = current_user.id
    service = StatisticsEngineService(db)
    return service.get_user_consolidated_overview(uid, current_user.group_id)


@router.get("/personal/{exercise_id}/", response_model=List[StatsOutput])
async def get_personal_stats(
        exercise_id: int,
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches personal performance trends aggregated across the exercise hierarchy."""
    if target_user_id and current_user.role in ["admin", "trainer"]:
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user or (current_user.role == "trainer" and target_user.group_id != current_user.group_id):
            raise HTTPException(status_code=403, detail="Access denied to user stats")
        uid = target_user_id
    else:
        uid = current_user.id
    service = StatisticsEngineService(db)
    return service.calculate_realtime_stats(uid, exercise_id, current_user.group_id)


@router.get("/group-leaderboard/", response_model=List[GroupLeaderboardOutput])
async def get_group_leaderboard(
        start_date: datetime,
        end_date: datetime,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches group-wide rankings for the public dashboard within a timeframe."""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    service = StatisticsEngineService(db)
    return service.get_group_leaderboards(current_user.group_id, start_date, end_date)
