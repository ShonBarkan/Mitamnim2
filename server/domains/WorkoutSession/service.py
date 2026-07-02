import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import SQLAlchemyError
from core.logger import logger
from .models import WorkoutSession
# Import models from the sibling domain safely
from domains.ExerciseLog.models import ExerciseLog, ExerciseLogParam


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Create a new workout session along with all nested logs and parameters."""
        logger.info(f"Creating new fat workout session for user: {user_id}")
        try:
            # Step 1: Create the main session record with timezone awareness
            session_started_at = data.get("started_at") or datetime.now(timezone.utc)

            new_session = WorkoutSession(
                user_id=user_id,
                template_id=data.get("template_id"),
                name=data.get("name"),
                started_at=session_started_at,
                note=data.get("note")
            )
            self.db.add(new_session)
            self.db.flush()

            # Step 2: Iterate and create associated exercise logs
            logs_data = data.get("logs", [])
            for idx, log_data in enumerate(logs_data):
                # Build payload explicitly to avoid invalid keyword arguments
                log_payload = {
                    "user_id": user_id,
                    "session_id": new_session.id,
                    "exercise_id": log_data.get("exercise_id"),
                    "exercise_name": log_data.get("exercise_name"),
                    "sets": log_data.get("sets", 1),
                    "position": log_data.get("position", idx),
                    "created_at": session_started_at  # Automatically sync log time to session time
                }

                new_log = ExerciseLog(**log_payload)
                self.db.add(new_log)
                self.db.flush()

                # Step 3: Iterate and create parameters for each log
                params_data = log_data.get("params", [])
                for param_data in params_data:
                    new_param = ExerciseLogParam(
                        log_id=new_log.id,
                        parameter_name=param_data.get("parameter_name"),
                        parameter_unit=param_data.get("parameter_unit"),
                        value=param_data.get("value")
                    )
                    self.db.add(new_param)

            # Step 4: Commit the entire transaction atomically
            self.db.commit()
            self.db.refresh(new_session)
            logger.info(f"Session completely structured and created successfully: {new_session.id}")
            return new_session

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error while creating fat session for user {user_id}: {str(e)}")
            raise e

    def get_user_sessions(self, user_id: uuid.UUID) -> list:
        """
        Get all sessions for a specific user.
        The service logic here relies on the router to pass the correct target user_id,
        whether it's the current user or a trainee managed by a trainer.
        """
        logger.info(f"Retrieving nested sessions catalog for user: {user_id}")
        return self.db.query(WorkoutSession).filter(
            WorkoutSession.user_id == user_id
        ).options(
            # Eager load logs and params to avoid N+1 queries
            selectinload(WorkoutSession.logs).selectinload(ExerciseLog.params)
        ).order_by(WorkoutSession.started_at.desc()).all()

    def get_session_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> WorkoutSession:
        """Get a specific session with full nested details."""
        return self.db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id
        ).options(
            selectinload(WorkoutSession.logs).selectinload(ExerciseLog.params)
        ).first()

    def update_session(self, session_id: uuid.UUID, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Update top-level session details and cascade time changes to logs."""
        session = self.get_session_by_id(session_id, user_id)
        if not session:
            return None

        try:
            time_changed = False
            new_time = None

            for key, value in data.items():
                if hasattr(session, key) and value is not None:
                    setattr(session, key, value)
                    if key == "started_at":
                        time_changed = True
                        new_time = value

            # Cascade the new timestamp to all nested logs automatically
            if time_changed and new_time:
                for log in session.logs:
                    log.created_at = new_time
                logger.info(f"Cascaded session timestamp update to all nested logs for session: {session_id}")

            self.db.commit()
            self.db.refresh(session)
            return session
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e

    def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a session."""
        session = self.get_session_by_id(session_id, user_id)
        if session:
            try:
                self.db.delete(session)
                self.db.commit()
                return True
            except SQLAlchemyError:
                self.db.rollback()
                return False
        return False