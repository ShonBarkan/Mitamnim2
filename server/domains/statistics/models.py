import uuid
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

# --- Dashboard Stats Schemas ---

class DashboardConfigInfo(BaseModel):
    aggregation: str
    higher_better: bool
    exercise_id: Optional[int]
    position: int
    parameter_unit: str  # Added unit of measurement

class DashboardStatItem(BaseModel):
    user_data: Dict[str, float]
    config: DashboardConfigInfo

class DashboardStatsOut(BaseModel):
    stats: Dict[str, DashboardStatItem]


# --- Personal/Athlete Stats Schemas ---

class TrendDataPoint(BaseModel):
    date: datetime
    value: float

class AthleteStatsOut(BaseModel):
    user_id: uuid.UUID
    exercise_id: Optional[int]
    parameter_name: str
    parameter_unit: str  # Added unit of measurement
    trends: List[TrendDataPoint]
    max_value: Optional[float]
    avg_value: Optional[float]


# --- Group Trends Schemas ---

class GroupTrendDataPoint(BaseModel):
    date: datetime
    avg_value: float
    max_value: float

class GroupStatsOut(BaseModel):
    group_id: uuid.UUID
    exercise_id: Optional[int]
    parameter_name: str
    parameter_unit: str  # Added unit of measurement
    trends: List[GroupTrendDataPoint]