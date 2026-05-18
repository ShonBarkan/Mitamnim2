import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

# --- PYDANTIC SCHEMAS FOR GRAPHING & ANALYTICS ---

class DataPointSchema(BaseModel):
    """Raw timeline data element optimized for linear frontend charts plotting."""
    timestamp: datetime
    value: float

class ParameterMetricOut(BaseModel):
    """Aggregated calculation metrics representing structural parameters performance."""
    parameter_id: int
    parameter_name: str
    unit: str
    strategy_applied: str
    computed_value: float
    graph_data: List[DataPointSchema] = []

class ExerciseStatsOut(BaseModel):
    """Aggregated collection of parameter metrics computed for a target exercise profile."""
    exercise_id: int
    exercise_name: str
    metrics: List[ParameterMetricOut]

class SingleUserStatsReport(BaseModel):
    """Comprehensive performance tracking evaluation matrix for an isolated trainee."""
    user_id: uuid.UUID
    full_name: str
    total_workouts: int
    start_date: datetime
    end_date: datetime
    exercises: List[ExerciseStatsOut]

class GroupOverviewStatsReport(BaseModel):
    """Panoramic macro overview summarizing collective data metrics across an entire group."""
    group_id: uuid.UUID
    total_group_workouts: int
    start_date: datetime
    end_date: datetime
    collective_exercises: List[ExerciseStatsOut]
    member_breakdown: List[SingleUserStatsReport] = []