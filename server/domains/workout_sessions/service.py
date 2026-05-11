from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .models import WorkoutSession, WorkoutSessionFinish
from ..users.models import User
from ..activities.models import ActivityLog
from ..parameters.models import Parameter


# --- WorkoutSessionService ---

class WorkoutSessionService:
    def __init__(self, db: Session):
        self.db = db

    def _calculate_virtual_value(self, calc_type: str, sources: List[float], multiplier: float) -> str:
        """Core math engine for dependent (virtual) parameters."""
        try:
            if calc_type == 'sum':
                res = sum(sources)
            elif calc_type == 'subtract':
                res = sources[0] - (sources[1] if len(sources) > 1 else 0)
            elif calc_type == 'multiply':
                res = 1
                for v in sources: res *= v
            elif calc_type == 'divide':
                res = sources[0] / sources[1] if len(sources) > 1 and sources[1] != 0 else 0
            elif calc_type == 'percentage':
                res = (sources[0] / sources[1] * 100) if len(sources) > 1 and sources[1] != 0 else 0
            elif calc_type == 'conversion':
                res = sources[0] * (multiplier or 1)
            else:
                res = 0

            return f"{res:.2f}".rstrip('0').rstrip('.')
        except Exception:
            return "0"

    def finish_workout(self, user: User, data: WorkoutSessionFinish) -> WorkoutSession:
        """
        Finalizes the workout. Splits the bulk payload so that each set
        becomes a separate ActivityLog entry.
        
        The start_time is taken from the frontend payload (data.start_time), allowing
        the user to specify when the workout actually began, rather than using the 
        server's current time.
        """
        if not data.performed_exercises:
            raise ValueError("לא ניתן לסיים אימון ללא תרגילים שבוצעו")

        # Fetch all group parameters to calculate virtual values server-side if missing
        all_params = {p.id: p for p in self.db.query(Parameter).filter(Parameter.group_id == user.group_id).all()}

        # end_time is set to when the user is finishing/submitting the workout (now)
        # start_time is taken from the frontend, allowing the user to specify when the workout began
        end_time = datetime.now(timezone.utc)

        # Create main session record
        db_session = WorkoutSession(
            user_id=user.id,
            template_id=data.template_id,
            start_time=data.start_time,
            end_time=end_time,
            workout_summary=data.workout_summary,
            actual_duration=data.actual_duration
        )
        self.db.add(db_session)
        self.db.flush()

        # Iterate through exercises and their corresponding sets
        for exercise in data.performed_exercises:
            for set_data in exercise.performance_data:
                # current_set_values: {param_id: value} for lookup/math
                current_set_values = {p.parameter_id: p.value for p in set_data}

                # Final set performance data (flat list of params for this single set)
                final_set_params = [p.model_dump() for p in set_data]

                # Check and calculate virtual parameters for this specific set
                for p_id, p_meta in all_params.items():
                    if p_meta.is_virtual and p_id not in current_set_values:
                        source_ids = p_meta.source_parameter_ids or []
                        if all(sid in current_set_values for sid in source_ids):
                            source_values = [float(current_set_values[sid]) for sid in source_ids]
                            calculated_val = self._calculate_virtual_value(
                                p_meta.calculation_type,
                                source_values,
                                p_meta.multiplier
                            )
                            final_set_params.append({"parameter_id": p_id, "value": calculated_val})

                # Create a SEPARATE row for EACH SET
                # Use start_time from the frontend (when workout actually began), not server's current time
                set_log = ActivityLog(
                    exercise_id=exercise.exercise_id,
                    user_id=user.id,
                    workout_session_id=db_session.id,
                    timestamp=data.start_time,
                    performance_data=final_set_params  # JSONB: List[Dict] for one set
                )
                self.db.add(set_log)

        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def get_user_history(self, user_id) -> List[WorkoutSession]:
        """Retrieves history and counts unique exercises performed in each session."""
        sessions = (
            self.db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.template))
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.start_time.desc())
            .all()
        )

        for s in sessions:
            s.template_name = s.template.name if s.template else "אימון מותאם אישית"
            # Count unique exercise_ids across all logs (sets) in the session
            unique_exercises = {log.exercise_id for log in s.logs}
            s.exercise_count = len(unique_exercises)

        return sessions
