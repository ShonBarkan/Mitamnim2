import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, ConfigDict


# --- Pydantic Schemas ---

class StatsOutput(BaseModel):
    """Schema for historical performance data with trends."""
    timestamp: datetime
    value: float
    label: str
    unit: Optional[str] = None
    trend_percentage: float = 0.0
    model_config = ConfigDict(from_attributes=True)


class PRRecord(BaseModel):
    """Entry for the Personal Record (PR) Hall of Fame."""
    exercise_name: str
    value: float
    unit: Optional[str] = None
    date: datetime


class TrainingDayDist(BaseModel):
    """Count of workouts per day of the week."""
    day_name: str
    count: int


class UserOverviewStats(BaseModel):
    """Consolidated high-level overview for the user dashboard."""
    total_workouts: int
    total_duration_minutes: int
    relative_rank_percentile: float  # e.g., Top 10%
    day_distribution: List[TrainingDayDist]
    pr_hall_of_fame: List[PRRecord]
    velocity_of_progress: Dict[str, float]  # Exercise name -> percentage change


class LeaderboardEntry(BaseModel):
    """Individual entry in the group leaderboard ranking."""
    full_name: str
    value: float
    rank: int


class GroupLeaderboardOutput(BaseModel):
    """Container for a specific exercise/parameter ranking set."""
    exercise_id: int
    exercise_name: str
    parameter_name: str
    unit: Optional[str] = None
    ranking_direction: str
    entries: List[LeaderboardEntry]
