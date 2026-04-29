from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.database import SessionLocal

def cleanup_old_messages(db: Session):
    """
    Standard maintenance task to delete old messages that are not marked as main/sticky.
    """
    # Local import to prevent circular dependency during startup
    from domains.messages import Message

    # Calculate the cutoff date (4 days ago)
    cutoff_date = datetime.utcnow() - timedelta(days=4)

    # Delete messages older than the cutoff, that are NOT marked as 'is_main'
    db.query(Message).filter(
        Message.created_at < cutoff_date,
        Message.is_main == False
    ).delete()

    db.commit()

def scheduled_cleanup():
    """
    Wrapper for the scheduler to handle its own database session.
    """
    db = SessionLocal()
    try:
        cleanup_old_messages(db)
        print(f"[{datetime.utcnow()}] Scheduled cleanup completed successfully.")
    except Exception as e:
        print(f"[{datetime.utcnow()}] Error during scheduled cleanup: {e}")
    finally:
        db.close()