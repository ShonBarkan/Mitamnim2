import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session, joinedload
from domains.workout_sessions.models import WorkoutSession, PerformedSet, PerformedSetValue
from core.logger import logger

class WorkoutSessionService:
    @staticmethod
    def get_user_sessions(db: Session, user_id: uuid.UUID) -> List[WorkoutSession]:
        """Queries and retrieves historic logged session rows using eager loads initialization."""
        logger.info(f"Fetching structural workout tracking logs for user_id: {user_id}")
        return db.query(WorkoutSession).options(
            joinedload(WorkoutSession.performed_sets).joinedload(PerformedSet.set_values)
        ).filter(WorkoutSession.user_id == user_id).order_by(WorkoutSession.end_time.desc()).all()

    @staticmethod
    def finalize_session(db: Session, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Atomically un-rolls and stores structured exercise set matrices into flat records."""
        logger.info(f"Persisting incoming performance logs session mapping grid for user_id: {user_id}")

        # 1. Spawn root header entry
        session = WorkoutSession(
            user_id=user_id,
            template_id=data.get("template_id"),
            start_time=data["start_time"].replace(tzinfo=None),
            end_time=datetime.now(timezone.utc).replace(tzinfo=None),
            workout_summary=data.get("workout_summary"),
            actual_duration=data.get("actual_duration")
        )
        db.add(session)
        db.flush()

        # 2. Map and bind granular set sequences
        for ex_payload in data.get("performed_exercises", []):
            for set_payload in ex_payload.get("sets", []):
                perf_set = PerformedSet(
                    workout_session_id=session.id,
                    exercise_id=ex_payload["exercise_id"],
                    set_number=set_payload["set_number"]
                )
                db.add(perf_set)
                db.flush()

                # 3. Stream values directly down into normalized metrics tables
                for metric in set_payload.get("metrics", []):
                    val_node = PerformedSetValue(
                        performed_set_id=perf_set.id,
                        parameter_id=metric["parameter_id"],
                        value=metric["value"]
                    )
                    db.add(val_node)

        db.commit()
        db.refresh(session)
        logger.info(f"Workout session id: {session.id} completely finalized and committed.")
        return session