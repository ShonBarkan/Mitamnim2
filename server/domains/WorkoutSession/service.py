import uuid
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import SQLAlchemyError
from core.logger import logger
from .models import WorkoutSession
# ExerciseLog and ExerciseLogParam are defined in the sibling ExerciseLog domain
# Import them using a relative import to avoid circular import issues
from ..ExerciseLog.models import ExerciseLog, ExerciseLogParam

class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Create a new workout session along with all nested logs and parameters."""
        logger.info(f"Creating new fat workout session for user: {user_id}")
        try:
            # Step 1: Create the main session record
            new_session = WorkoutSession(
                user_id=user_id,
                template_id=data.get("template_id"),
                name=data.get("name"),
                started_at=data.get("started_at", datetime.utcnow()),
                finished_at=data.get("finished_at"),
                note=data.get("note")
            )
            self.db.add(new_session)
            # flush() assigns an ID to new_session without committing the transaction
            self.db.flush()

            # Step 2: Iterate and create associated exercise logs
            logs_data = data.get("logs", [])
            for idx, log_data in enumerate(logs_data):
                new_log = ExerciseLog(
                    user_id=user_id,
                    session_id=new_session.id,
                    exercise_id=log_data.get("exercise_id"),
                    exercise_name=log_data.get("exercise_name"),
                    sets=log_data.get("sets", 1),
                    position=log_data.get("position", idx)
                )
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
        """Get all sessions for a specific user with eager loading for optimization."""
        logger.info(f"Retrieving nested sessions catalog for user: {user_id}")
        return self.db.query(WorkoutSession).filter(
            WorkoutSession.user_id == user_id
        ).options(
            # Explicit eager loading prevents N+1 queries issue
            selectinload(WorkoutSession.logs).selectinload(ExerciseLog.params)
        ).order_by(WorkoutSession.started_at.desc()).all()

    def get_session_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> WorkoutSession:
        """Get a specific session with full nested details."""
        logger.info(f"Fetching complete session ID: {session_id} for user: {user_id}")
        return self.db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id
        ).options(
            selectinload(WorkoutSession.logs).selectinload(ExerciseLog.params)
        ).first()

    def update_session(self, session_id: uuid.UUID, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Update top-level session details."""
        logger.info(f"Updating top-level details for session ID: {session_id}")
        session = self.get_session_by_id(session_id, user_id)

        if not session:
            logger.warning(f"Session ID: {session_id} not found or unauthorized for update.")
            return None

        try:
            for key, value in data.items():
                if hasattr(session, key) and value is not None:
                    setattr(session, key, value)
            self.db.commit()
            self.db.refresh(session)
            logger.info(f"Session ID: {session_id} top-level details updated")
            return session
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error while updating session {session_id}: {str(e)}")
            raise e

    def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a session (Cascades down to logs and params based on model definition)."""
        logger.warning(f"Attempting to purge session ID: {session_id} for user: {user_id}")
        session = self.get_session_by_id(session_id, user_id)

        if session:
            try:
                self.db.delete(session)
                self.db.commit()
                logger.info(f"Session ID: {session_id} successfully purged")
                return True
            except SQLAlchemyError as e:
                self.db.rollback()
                logger.error(f"Database error while purging session {session_id}: {str(e)}")
                raise e

        logger.warning(f"Session ID: {session_id} not found for deletion.")
        return False