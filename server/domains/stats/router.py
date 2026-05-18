import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from middlewares.auth import get_current_user
from domains.stats.models import SingleUserStatsReport, GroupOverviewStatsReport
from domains.stats.service import StatsService

router = APIRouter(prefix="/stats", tags=["Analytical Statistics Dashboard"])

@router.get("/me", response_model=SingleUserStatsReport)
async def get_my_historical_stats(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Fetches clean, chart-ready performance analytics bounded within a date range for the user."""
    return StatsService.compute_user_stats(db, current_user.id, start_date, end_date)

@router.get("/group/panoramic", response_model=GroupOverviewStatsReport)
async def get_group_panoramic_metrics(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Provides trainers a multi-level stats view over the range.
    Returns collective group trends alongside granular member-by-member breakdowns.
    """
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Elite metric dashboards restricted to managers and trainers."
        )
    if not current_user.group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer missing a verified group boundary assignment link."
        )

    return StatsService.compute_group_panoramic_stats(db, current_user.group_id, start_date, end_date)