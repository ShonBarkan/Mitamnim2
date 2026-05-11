from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from db.database import get_db
from middlewares.auth import get_current_user

from .models import MessageOut, MessageCreate, MessageUpdate
from .service import MessageService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/", response_model=List[MessageOut])
async def get_my_messages(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all messages for the current user (sent and received)."""
    service = MessageService(db)
    return service.get_messages_for_user(current_user.id)


@router.get("/group/{group_id}", response_model=List[MessageOut])
async def get_group_messages(
        group_id,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all messages for a specific group."""
    # Check if user has access to this group
    if current_user.role != "admin" and current_user.group_id != group_id:
        raise HTTPException(status_code=403, detail="Access denied to group messages")

    service = MessageService(db)
    return service.get_group_messages(group_id)


@router.get("/personal/{other_user_id}", response_model=List[MessageOut])
async def get_personal_messages(
        other_user_id,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves personal messages between current user and another user."""
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if users are in the same group and appropriate roles
    if current_user.group_id != other_user.group_id:
        raise HTTPException(status_code=403, detail="Cannot access messages with users from other groups")

    if current_user.role == "trainee" and other_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Trainees can only message trainers")
    elif current_user.role == "trainer" and other_user.role not in ["trainee", "trainer"]:
        raise HTTPException(status_code=403, detail="Trainers can only message trainees or other trainers")

    service = MessageService(db)
    return service.get_personal_messages_between_users(current_user.id, other_user_id)


@router.post("/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(
        message_data: MessageCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new message."""
    service = MessageService(db)

    # Validate message type and permissions
    if message_data.message_type == "personal":
        if not message_data.recipient_id:
            raise HTTPException(status_code=400, detail="Personal messages require a recipient_id")
        if message_data.group_id:
            raise HTTPException(status_code=400, detail="Personal messages cannot have a group_id")
        # Check recipient
        recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        if current_user.group_id != recipient.group_id:
            raise HTTPException(status_code=403, detail="Cannot send messages to users from other groups")
        if current_user.role == "trainee" and recipient.role != "trainer":
            raise HTTPException(status_code=403, detail="Trainees can only message trainers")
        elif current_user.role == "trainer" and recipient.role not in ["trainee", "trainer"]:
            raise HTTPException(status_code=403, detail="Trainers can only message trainees or other trainers")
    elif message_data.message_type == "general":
        if not message_data.group_id:
            raise HTTPException(status_code=400, detail="General messages require a group_id")
        if message_data.recipient_id:
            raise HTTPException(status_code=400, detail="General messages cannot have a recipient_id")
        # Check group access
        if current_user.role != "admin" and current_user.group_id != message_data.group_id:
            raise HTTPException(status_code=403, detail="Cannot send messages to other groups")
    else:
        raise HTTPException(status_code=400, detail="Invalid message type")

    return service.create_message(message_data, current_user.id)


@router.patch("/{message_id}", response_model=MessageOut)
async def update_message(
        message_id,
        message_update: MessageUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates a message (only sender can update their own messages)."""
    service = MessageService(db)
    db_message = service.get_message_by_id(message_id)

    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")

    if db_message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own messages")

    return service.update_message(db_message, message_update)


@router.delete("/{message_id}")
async def delete_message(
        message_id,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a message (only sender or admin can delete)."""
    service = MessageService(db)
    db_message = service.get_message_by_id(message_id)

    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Allow deletion if user is sender or admin
    if db_message.sender_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    service.delete_message(db_message)
    return {"message": "Message deleted successfully"}


@router.get("/main", response_model=List[MessageOut])
async def get_main_messages(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves main/sticky messages for the user's group."""
    service = MessageService(db)
    return service.get_main_messages(current_user.group_id)


@router.get("/contacts", response_model=List[Dict[str, Any]])
async def get_contacts(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves authorized contacts for the current user."""
    service = MessageService(db)
    return service.get_contacts(current_user)


@router.get("/history/{target_id}", response_model=List[MessageOut])
async def get_history(
        target_id,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves message history for a target (group or user)."""
    from ..groups.models import Group
    group = db.query(Group).filter(Group.id == target_id).first()
    if group:
        if group.id != current_user.group_id:
            raise HTTPException(status_code=403, detail="Access denied to group messages")
        service = MessageService(db)
        return service.get_group_messages(target_id)
    else:
        # Assume it's a user
        other_user = db.query(User).filter(User.id == target_id).first()
        if not other_user:
            raise HTTPException(status_code=404, detail="Target not found")
        if current_user.group_id != other_user.group_id:
            raise HTTPException(status_code=403, detail="Cannot access messages with users from other groups")
        if current_user.role == "trainee" and other_user.role != "trainer":
            raise HTTPException(status_code=403, detail="Trainees can only message trainers")
        elif current_user.role == "trainer" and other_user.role not in ["trainee", "trainer"]:
            raise HTTPException(status_code=403, detail="Trainers can only message trainees or other trainers")
        service = MessageService(db)
        return service.get_personal_messages_between_users(current_user.id, target_id)
