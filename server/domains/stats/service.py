import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float
from domains.workout_sessions.models import WorkoutSession, PerformedSet, PerformedSetValue
from domains.exercises.models import GroupExerciseRegistry
from domains.parameters.models import Parameter
from domains.users.models import User
from core.logger import logger


class StatsService:
    @staticmethod
    def compute_user_stats(db: Session, user_id: uuid.UUID, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Compiles clean chronological stats metrics for a trainee using relational aggregations."""
        logger.info(f"Computing database performance matrices for user: {user_id} between {start_date} and {end_date}")

        # 1. Capture user profile context metadata
        user = db.query(User).filter(User.id == user_id).first()
        full_name = f"{user.first_name} {user.second_name}" if user else "Unknown User"

        # 2. Count distinct completed workout sessions inside temporal range bounds
        total_workouts = db.query(func.count(WorkoutSession.id)).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.end_time >= start_date,
            WorkoutSession.end_time <= end_date
        ).scalar() or 0

        # 3. Pull raw transactional metric logs joining tables together flatly
        raw_values = db.query(
            GroupExerciseRegistry.id.label("exercise_id"),
            GroupExerciseRegistry.name.label("exercise_name"),
            Parameter.id.label("parameter_id"),
            Parameter.name.label("parameter_name"),
            Parameter.unit.label("unit"),
            Parameter.aggregation_strategy.label("strategy"),
            WorkoutSession.end_time.label("timestamp"),
            cast(PerformedSetValue.value, Float).label("numeric_val")
        ).join(PerformedSet, PerformedSet.workout_session_id == WorkoutSession.id) \
            .join(GroupExerciseRegistry, GroupExerciseRegistry.id == PerformedSet.exercise_id) \
            .join(PerformedSetValue, PerformedSetValue.performed_set_id == PerformedSet.id) \
            .join(Parameter, Parameter.id == PerformedSetValue.parameter_id) \
            .filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.end_time >= start_date,
            WorkoutSession.end_time <= end_date
        ).order_by(WorkoutSession.end_time.asc()).all()

        return StatsService._package_aggregation_tree(raw_values, user_id, full_name, total_workouts, start_date,
                                                      end_date)

    @staticmethod
    def compute_group_panoramic_stats(db: Session, group_id: uuid.UUID, start_date: datetime, end_date: datetime) -> \
    Dict[str, Any]:
        """Builds collective bird's-eye visibility matrices alongside individual members breakdown."""
        logger.info(f"Generating global group aggregation statistics overview for group_id: {group_id}")

        # 1. Total sessions run by all members inside target perimeter boundaries
        total_group_workouts = db.query(func.count(WorkoutSession.id)).join(User,
                                                                            User.id == WorkoutSession.user_id).filter(
            User.group_id == group_id,
            WorkoutSession.end_time >= start_date,
            WorkoutSession.end_time <= end_date
        ).scalar() or 0

        # 2. Extract macro raw records pool intersecting the collective community
        collective_raw = db.query(
            GroupExerciseRegistry.id.label("exercise_id"),
            GroupExerciseRegistry.name.label("exercise_name"),
            Parameter.id.label("parameter_id"),
            Parameter.name.label("parameter_name"),
            Parameter.unit.label("unit"),
            Parameter.aggregation_strategy.label("strategy"),
            WorkoutSession.end_time.label("timestamp"),
            cast(PerformedSetValue.value, Float).label("numeric_val")
        ).join(User, User.id == WorkoutSession.user_id) \
            .join(PerformedSet, PerformedSet.workout_session_id == WorkoutSession.id) \
            .join(GroupExerciseRegistry, GroupExerciseRegistry.id == PerformedSet.exercise_id) \
            .join(PerformedSetValue, PerformedSetValue.performed_set_id == PerformedSet.id) \
            .join(Parameter, Parameter.id == PerformedSetValue.parameter_id) \
            .filter(
            User.group_id == group_id,
            WorkoutSession.end_time >= start_date,
            WorkoutSession.end_time <= end_date
        ).order_by(WorkoutSession.end_time.asc()).all()

        packaged_collective = StatsService._package_aggregation_tree(
            collective_raw, group_id, "Collective Group View", total_group_workouts, start_date, end_date
        )

        # 3. Compile standalone reports across each active group trainee node recursively
        group_members = db.query(User).filter(User.group_id == group_id).all()
        member_breakdown = []
        for member in group_members:
            member_breakdown.append(StatsService.compute_user_stats(db, member.id, start_date, end_date))

        return {
            "group_id": group_id,
            "total_group_workouts": total_group_workouts,
            "start_date": start_date,
            "end_date": end_date,
            "collective_exercises": packaged_collective["exercises"],
            "member_breakdown": member_breakdown
        }

    @staticmethod
    def _package_aggregation_tree(raw_rows, owner_id, label, workout_count, start, end) -> Dict[str, Any]:
        """Internal helper processing relational logs streams into structured graph schemas arrays."""
        tree: Dict[int, Dict[str, Any]] = {}

        for row in raw_rows:
            if row.exercise_id not in tree:
                tree[row.exercise_id] = {"exercise_id": row.exercise_id, "exercise_name": row.exercise_name,
                                         "metrics": {}}

            ex_node = tree[row.exercise_id]["metrics"]
            if row.parameter_id not in ex_node:
                ex_node[row.parameter_id] = {
                    "parameter_id": row.parameter_id,
                    "parameter_name": row.parameter_name,
                    "unit": row.unit,
                    "strategy_applied": row.strategy,
                    "raw_points": []
                }

            ex_node[row.parameter_id]["raw_points"].append({"timestamp": row.timestamp, "value": row.numeric_val})

        processed_exercises = []
        for ex_id, ex_data in tree.items():
            metrics_list = []
            for p_id, p_data in ex_data["metrics"].items():
                points = p_data["raw_points"]
                values_array = [pt["value"] for pt in points]

                # Dynamic strategy execution driven directly by parameter configurations
                if p_data["strategy_applied"] == "max":
                    computed = max(values_array) if values_array else 0.0
                elif p_data["strategy_applied"] == "avg":
                    computed = (sum(values_array) / len(values_array)) if values_array else 0.0
                else:  # Default fallback 'sum' mapping rule
                    computed = sum(values_array) if values_array else 0.0

                metrics_list.append({
                    "parameter_id": p_id,
                    "parameter_name": p_data["parameter_name"],
                    "unit": p_data["unit"],
                    "strategy_applied": p_data["strategy_applied"],
                    "computed_value": round(computed, 2),
                    "graph_data": points  # Raw timestamps + values pairing directly loaded for charts
                })

            processed_exercises.append({
                "exercise_id": ex_id,
                "exercise_name": ex_data["exercise_name"],
                "metrics": metrics_list
            })

        return {
            "user_id": owner_id,
            "full_name": label,
            "total_workouts": workout_count,
            "start_date": start,
            "end_date": end,
            "exercises": processed_exercises
        }