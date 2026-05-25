from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from .models import WorkoutSession
import uuid
from core.logger import logger
from datetime import datetime


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Create a new workout session (Active or Freestyle)."""
        logger.info(f"Creating new workout session for user: {user_id}")
        try:
            new_session = WorkoutSession(
                user_id=user_id,
                template_id=data.get("template_id"),
                name=data["name"],
                note=data.get("note")
            )
            self.db.add(new_session)
            self.db.commit()
            self.db.refresh(new_session)
            logger.info(f"Session created successfully: {new_session.id}")
            return new_session
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error while creating session for user {user_id}: {str(e)}")
            raise e

    def get_user_sessions(self, user_id: uuid.UUID) -> list:
        """Get all sessions for a specific user."""
        logger.info(f"Retrieving sessions catalog for user: {user_id}")
        return self.db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id).all()

    def get_session_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> WorkoutSession:
        """Get a specific session."""
        logger.info(f"Fetching session ID: {session_id} for user: {user_id}")
        return self.db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id
        ).first()

    def update_session(self, session_id: uuid.UUID, user_id: uuid.UUID, data: dict) -> WorkoutSession:
        """Update session details (e.g., add note or finish time)."""
        logger.info(f"Updating session ID: {session_id} for user: {user_id}")
        session = self.get_session_by_id(session_id, user_id)

        if not session:
            logger.warning(f"Session ID: {session_id} not found or unauthorized for update.")
            return None

        try:
            for key, value in data.items():
                if value is not None:
                    setattr(session, key, value)
            self.db.commit()
            self.db.refresh(session)
            logger.info(f"Session ID: {session_id} updated successfully")
            return session
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error while updating session {session_id}: {str(e)}")
            raise e

    def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a session."""
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