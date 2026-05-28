import uuid
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

# --- Common Schemas ---

class TagOut(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True

# --- Dashboard Stats Schemas ---

class DashboardConfigInfo(BaseModel):
    aggregation: str
    higher_better: bool
    exercise_id: Optional[int]
    position: int
    parameter_unit: str

class DashboardStatItem(BaseModel):
    user_data: Dict[str, float]
    config: DashboardConfigInfo

class DashboardStatsOut(BaseModel):
    stats: Dict[str, DashboardStatItem]


# --- Raw Statistics Schemas ---

class ExerciseLogParamOut(BaseModel):
    id: uuid.UUID
    parameter_name: str
    parameter_unit: str
    value: float
    display_method: Optional[str] = None  # Aggregation strategy (e.g., SUM, MAX, AVG)
    tags: List[TagOut] = []               # Tags associated with the parameter

    class Config:
        from_attributes = True

class ExerciseLogOut(BaseModel):
    id: uuid.UUID
    session_id: Optional[uuid.UUID]
    exercise_id: int
    exercise_name: str
    sets: Optional[int]
    created_at: datetime
    user_id: uuid.UUID
    position: int
    params: List[ExerciseLogParamOut] = []
    tags: List[TagOut] = []               # Tags associated with the exercise

    class Config:
        from_attributes = True

class RawStatisticsData(BaseModel):
    total_sessions: int
    total_duration_minutes: float
    logs: List[ExerciseLogOut]

# Athlete endpoint model (Single user profile + stats)
class AthleteStatsOut(BaseModel):
    user_id: uuid.UUID
    first_name: Optional[str]
    second_name: Optional[str]
    profile_picture: Optional[str]
    stats: RawStatisticsData

# Trainer endpoint model (Group stats list)
class TrainerGroupStatsOut(BaseModel):
    data: List[AthleteStatsOut]