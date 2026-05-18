import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from middlewares.auth import get_current_user
from core.logger import logger
from core.socket_manager import socket_manager

from .models import MessageOut, MessageCreate, MessageUpdate
from .service import MessageService
from domains.users.models import User

# --- Router Setup ---
router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("", response_model=List[MessageOut])
async def get_my_messages(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all messages for the current user (sent and received)."""
    service = MessageService(db)
    return service.get_messages_for_user(current_user.id)


@router.get("/group/{group_id}", response_model=List[MessageOut])
async def get_group_messages(
        group_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all messages for a specific group."""
    if current_user.role != "admin" and current_user.group_id != group_id:
        raise HTTPException(status_code=403, detail="Access denied to group messages")

    service = MessageService(db)
    return service.get_group_messages(group_id)


@router.get("/personal/{other_user_id}", response_model=List[MessageOut])
async def get_personal_messages(
        other_user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves personal messages between current user and another user."""
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.group_id != other_user.group_id:
        raise HTTPException(status_code=403, detail="Cannot access messages with users from other groups")

    if current_user.role == "trainee" and other_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Trainees can only message trainers")
    elif current_user.role == "trainer" and other_user.role not in ["trainee", "trainer"]:
        raise HTTPException(status_code=403, detail="Trainers can only message trainees or other trainers")

    service = MessageService(db)
    return service.get_personal_messages_between_users(current_user.id, other_user_id)


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(
        message_data: MessageCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new relational communication message and broadcasts it live via WebSockets."""
    service = MessageService(db)

    if message_data.message_type == "personal":
        if not message_data.recipient_id:
            raise HTTPException(status_code=400, detail="Personal messages require a recipient_id")
        if message_data.group_id:
            raise HTTPException(status_code=400, detail="Personal messages cannot have a group_id")

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
        if current_user.role != "admin" and current_user.group_id != message_data.group_id:
            raise HTTPException(status_code=403, detail="Cannot send messages to other groups")
    else:
        raise HTTPException(status_code=400, detail="Invalid message type")

    created_msg = service.create_message(message_data, current_user.id)

    # Map out a clean, Pydantic-validated payload dictionary to transmit over socket networks safely
    socket_payload = {
        "action": "MESSAGE_CREATED",
        "data": MessageOut.model_validate(created_msg).model_dump(mode="json")
    }

    # Pipeline real-time signals based on target permission boundaries
    if created_msg.message_type == "general":
        await socket_manager.broadcast_to_group(created_msg.group_id, socket_payload)
    else:
        await socket_manager.send_to_user(created_msg.sender_id, socket_payload)
        await socket_manager.send_to_user(created_msg.recipient_id, socket_payload)

    return created_msg


@router.patch("/{message_id}", response_model=MessageOut)
async def update_message(
        message_id: uuid.UUID,
        message_update: MessageUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates a message and synchronizes modifications instantly to all target client screens."""
    service = MessageService(db)
    db_message = service.get_message_by_id(message_id)

    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")

    if db_message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own messages")

    updated_msg = service.update_message(db_message, message_update)

    socket_payload = {
        "action": "MESSAGE_UPDATED",
        "data": MessageOut.model_validate(updated_msg).model_dump(mode="json")
    }

    if updated_msg.message_type == "general":
        await socket_manager.broadcast_to_group(updated_msg.group_id, socket_payload)
    else:
        await socket_manager.send_to_user(updated_msg.sender_id, socket_payload)
        await socket_manager.send_to_user(updated_msg.recipient_id, socket_payload)

    return updated_msg


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
        message_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a message from records and purges it live from client chats via socket streams."""
    service = MessageService(db)
    db_message = service.get_message_by_id(message_id)

    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")

    if db_message.sender_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    # Capture required entity fields before dropping the database instance mapping context
    msg_id = db_message.id
    msg_type = db_message.message_type
    group_id = db_message.group_id
    sender_id = db_message.sender_id
    recipient_id = db_message.recipient_id

    service.delete_message(db_message)

    socket_payload = {
        "action": "MESSAGE_DELETED",
        "data": {
            "id": str(msg_id),
            "message_type": msg_type,
            "group_id": str(group_id) if group_id else None,
            "sender_id": str(sender_id),
            "recipient_id": str(recipient_id) if recipient_id else None
        }
    }

    if msg_type == "general":
        await socket_manager.broadcast_to_group(group_id, socket_payload)
    else:
        await socket_manager.send_to_user(sender_id, socket_payload)
        await socket_manager.send_to_user(recipient_id, socket_payload)


@router.get("/main", response_model=List[MessageOut])
async def get_main_messages(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves active main/sticky announcements filtering both group and targeted user scopes concurrently."""
    service = MessageService(db)
    # Re-architected to pass both group_id and user_id to resolve structural data leaks
    return service.get_main_messages(current_user.group_id, current_user.id)


@router.get("/contacts")
async def get_contacts(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves authorized contact models using group perimeters filtering."""
    service = MessageService(db)
    raw_contacts = service.get_contacts(current_user)

    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "second_name": u.second_name,
            "username": u.username,
            "role": u.role,
            "profile_picture": u.profile_picture
        }
        for u in raw_contacts
    ]


@router.get("/history/{target_id}", response_model=List[MessageOut])
async def get_history(
        target_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves message history for a target group or distinct contact user."""
    from domains.groups.models import Group
    group = db.query(Group).filter(Group.id == target_id).first()

    if group:
        if group.id != current_user.group_id:
            raise HTTPException(status_code=403, detail="Access denied to group messages")
        service = MessageService(db)
        return service.get_group_messages(target_id)
    else:
        other_user = db.query(User).filter(User.id == target_id).first()
        if not other_user:
            raise HTTPException(status_code=404, detail="Target entity not found")
        if current_user.group_id != other_user.group_id:
            raise HTTPException(status_code=403, detail="Cannot access messages with users from other groups")
        if current_user.role == "trainee" and other_user.role != "trainer":
            raise HTTPException(status_code=403, detail="Trainees can only message trainers")
        elif current_user.role == "trainer" and other_user.role not in ["trainee", "trainer"]:
            raise HTTPException(status_code=403, detail="Trainers can only message trainees or other trainers")

        service = MessageService(db)
        return service.get_personal_messages_between_users(current_user.id, target_id)