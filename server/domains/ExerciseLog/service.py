from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from .models import ExerciseLog, ExerciseLogParam
from core.logger import logger
import uuid


class ExerciseLogService:
    """
    Service layer executing transaction logic for exercise logs.
    Manages creation, updates, deletions, and specific queries for logs and their snapshots.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_log(self, data: dict) -> ExerciseLog:
        """Creates a new exercise log with nested parameter snapshots and position tracking."""
        logger.info(f"Persisting new exercise log for exercise ID: {data.get('exercise_id')}")
        try:
            new_log = ExerciseLog(
                user_id=data.get("user_id"),
                session_id=data.get("session_id"),
                exercise_id=data["exercise_id"],
                exercise_name=data["exercise_name"],
                sets=data.get("sets", 1),
                position=data.get("position", 0),
                created_at=data.get("created_at")  # Support creating independent logs with custom dates
            )
            self.db.add(new_log)
            self.db.flush() # Ensure ID is generated for params

            for p in data.get("params", []):
                new_param = ExerciseLogParam(
                    log_id=new_log.id,
                    parameter_name=p["parameter_name"],
                    parameter_unit=p["parameter_unit"],
                    value=p["value"]
                )
                self.db.add(new_param)

            self.db.commit()
            self.db.refresh(new_log)
            logger.info(f"Successfully created exercise log ID: {new_log.id} at position: {new_log.position}")
            return new_log
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error during log creation: {str(e)}")
            raise e

    def get_session_logs(self, session_id: uuid.UUID) -> list:
        """Retrieves all logs bounded to a specific active session, ordered by position."""
        logger.info(f"Fetching logs bounded to session: {session_id}")
        return self.db.query(ExerciseLog)\
            .filter(ExerciseLog.session_id == session_id)\
            .order_by(ExerciseLog.position.asc())\
            .all()

    def get_user_logs(self, user_id: uuid.UUID) -> list:
        """Retrieves all exercise logs for a specific user."""
        logger.info(f"Fetching logs for user: {user_id}")
        return self.db.query(ExerciseLog).filter(ExerciseLog.user_id == user_id).order_by(ExerciseLog.created_at.desc()).all()

    def update_log(self, log_id: uuid.UUID, data: dict) -> ExerciseLog:
        """Updates base values, position, and re-syncs parameter snapshots."""
        logger.info(f"Updating exercise log ID: {log_id}")
        log = self.db.query(ExerciseLog).filter(ExerciseLog.id == log_id).first()
        if not log:
            return None

        try:
            # Update base fields
            if "sets" in data:
                log.sets = data["sets"]
            if "position" in data:
                log.position = data["position"]

            # Disconnect from session if created_at (timestamp) is explicitly modified
            if "created_at" in data and data["created_at"] is not None:
                log.created_at = data["created_at"]
                log.session_id = None
                logger.info(f"Log ID: {log_id} detached from session due to explicit timestamp modification.")

            # Update parameters
            if "params" in data:
                # Remove old parameters
                self.db.query(ExerciseLogParam).filter(ExerciseLogParam.log_id == log_id).delete()
                # Add updated parameters
                for p in data["params"]:
                    new_param = ExerciseLogParam(
                        log_id=log_id,
                        parameter_name=p["parameter_name"],
                        parameter_unit=p["parameter_unit"],
                        value=p["value"]
                    )
                    self.db.add(new_param)

            self.db.commit()
            self.db.refresh(log)
            logger.info(f"Successfully updated exercise log ID: {log_id}")
            return log
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error during log update: {str(e)}")
            raise e

    def delete_log(self, log_id: uuid.UUID) -> bool:
        """Purges an exercise log and cascades to parameter snapshots."""
        logger.warning(f"Purging exercise log ID: {log_id}")
        log = self.db.query(ExerciseLog).filter(ExerciseLog.id == log_id).first()
        if log:
            self.db.delete(log)
            self.db.commit()
            return True
        return False