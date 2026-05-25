from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from .models import ExerciseLog, ExerciseLogParam
from core.logger import logger
import uuid

class ExerciseLogService:
    def __init__(self, db: Session):
        self.db = db

    def create_log(self, data: dict) -> ExerciseLog:
        """Creates a new exercise log with nested parameters."""
        logger.info(f"Persisting new exercise log for exercise ID: {data['exercise_id']}")
        try:
            new_log = ExerciseLog(
                session_id=data.get("session_id"),
                exercise_id=data["exercise_id"],
                exercise_name=data["exercise_name"],
                sets=data["sets"]
            )
            self.db.add(new_log)
            self.db.flush() # Flush to retrieve log ID

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
            logger.info(f"Successfully created exercise log ID: {new_log.id}")
            return new_log
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error during log creation: {str(e)}")
            raise e

    def get_session_logs(self, session_id: uuid.UUID) -> list:
        """Retrieves all logs for a specific session."""
        logger.info(f"Fetching logs for session: {session_id}")
        return self.db.query(ExerciseLog).filter(ExerciseLog.session_id == session_id).all()

    def update_log(self, log_id: uuid.UUID, data: dict) -> ExerciseLog:
        """Updates sets and parameters of an existing log."""
        logger.info(f"Updating exercise log ID: {log_id}")
        log = self.db.query(ExerciseLog).filter(ExerciseLog.id == log_id).first()
        if not log:
            return None

        try:
            if "sets" in data:
                log.sets = data["sets"]

            if "params" in data:
                # ניקוי פרמטרים ישנים והוספת חדשים (הגישה הבטוחה ביותר לעדכון רשימות)
                self.db.query(ExerciseLogParam).filter(ExerciseLogParam.log_id == log_id).delete()
                for p in data["params"]:
                    self.db.add(ExerciseLogParam(
                        log_id=log_id,
                        parameter_name=p["parameter_name"],
                        parameter_unit=p["parameter_unit"],
                        value=p["value"]
                    ))

            self.db.commit()
            self.db.refresh(log)
            logger.info(f"Successfully updated exercise log ID: {log_id}")
            return log
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error during log update: {str(e)}")
            raise e

    def delete_log(self, log_id: uuid.UUID) -> bool:
        """Deletes an exercise log and its associated parameters."""
        logger.warning(f"Purging exercise log ID: {log_id}")
        log = self.db.query(ExerciseLog).filter(ExerciseLog.id == log_id).first()
        if log:
            self.db.delete(log)
            self.db.commit()
            logger.info(f"Exercise log ID: {log_id} deleted successfully")
            return True
        return False