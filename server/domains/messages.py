import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, or_, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and core imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from core.socket_manager import socket_manager

# Domain imports
from domains.users import User
from domains.groups import Group


# --- Database Model ---

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False)  # 'general' or 'personal'
    is_main = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    group = relationship("Group")


# --- Pydantic Schemas ---

class MessageCreate(BaseModel):
    content: str
    message_type: str
    recipient_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
    is_main: bool = False


class MessageUpdate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
    content: str
    message_type: str
    is_main: bool
    created_at: datetime
    sender_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# NEW: Schema for contact list
class ContactOut(BaseModel):
    id: uuid.UUID
    first_name: str
    second_name: str
    role: str
    full_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- MessageService ---

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def _get_full_name(self, user: User) -> str:
        return f"{user.first_name} {user.second_name}" if user else "Unknown"

    def get_message_by_id(self, message_id: uuid.UUID) -> Optional[Message]:
        return self.db.query(Message).filter(Message.id == message_id).first()

    def create_message(self, current_user: User, data: MessageCreate) -> Message:
        if data.is_main:
            query = self.db.query(Message).filter(Message.is_main == True)
            if data.message_type == "general":
                query = query.filter(Message.group_id == data.group_id)
            else:
                query = query.filter(
                    or_(
                        and_(Message.sender_id == current_user.id, Message.recipient_id == data.recipient_id),
                        and_(Message.sender_id == data.recipient_id, Message.recipient_id == current_user.id)
                    )
                )
            query.update({Message.is_main: False}, synchronize_session=False)

        new_message = Message(
            id=uuid.uuid4(),
            sender_id=current_user.id,
            recipient_id=data.recipient_id,
            group_id=data.group_id,
            content=data.content,
            message_type=data.message_type,
            is_main=data.is_main,
            created_at=datetime.utcnow()
        )
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        new_message.sender_name = self._get_full_name(current_user)
        return new_message

    def update_message(self, db_message: Message, content: str) -> Message:
        db_message.content = content
        self.db.commit()
        self.db.refresh(db_message)
        db_message.sender_name = self._get_full_name(db_message.sender)
        return db_message

    def delete_message(self, db_message: Message):
        self.db.delete(db_message)
        self.db.commit()

    def get_main_messages(self, user: User) -> List[Message]:
        main_messages = []
        if user.group_id:
            general = self.db.query(Message).filter(
                Message.group_id == user.group_id,
                Message.message_type == "general",
                Message.is_main == True
            ).order_by(Message.created_at.desc()).first()
            if general:
                general.sender_name = self._get_full_name(general.sender)
                main_messages.append(general)

        personal = self.db.query(Message).filter(
            Message.recipient_id == user.id,
            Message.message_type == "personal",
            Message.is_main == True
        ).order_by(Message.created_at.desc()).first()
        if personal:
            personal.sender_name = self._get_full_name(personal.sender)
            main_messages.append(personal)

        return main_messages

    def get_chat_history(self, target_id: uuid.UUID, current_user: User) -> List[Message]:
        group = self.db.query(Group).filter(Group.id == target_id).first()
        if group:
            if current_user.role != "admin" and current_user.group_id != group.id:
                raise HTTPException(status_code=403, detail="Access denied")
            messages = self.db.query(Message).filter(Message.group_id == target_id).order_by(
                Message.created_at.asc()).all()
        else:
            messages = self.db.query(Message).filter(
                Message.message_type == "personal",
                or_(
                    and_(Message.sender_id == current_user.id, Message.recipient_id == target_id),
                    and_(Message.sender_id == target_id, Message.recipient_id == current_user.id)
                )
            ).order_by(Message.created_at.asc()).all()

        for msg in messages:
            msg.sender_name = self._get_full_name(msg.sender)
        return messages

    # NEW: Logic for fetching contacts
    def get_contacts(self, current_user: User) -> List[User]:
        """
        Fetches users within the same group based on visibility rules.
        """
        query = self.db.query(User).filter(User.group_id == current_user.group_id, User.id != current_user.id)

        if current_user.role == "trainee":
            # Trainees only see trainers
            query = query.filter(User.role == "trainer")

        # Trainers see everyone in their group (trainees + other trainers)
        # Admin logic can be added here if needed, currently assuming they see everyone in their group

        contacts = query.all()
        for c in contacts:
            c.full_name = self._get_full_name(c)
        return contacts


# --- Router Setup ---

router = APIRouter(prefix="/messages", tags=["Messages"])


# NEW: Contacts Endpoint
@router.get("/contacts", response_model=List[ContactOut])
async def get_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves a list of people the user is allowed to chat with."""
    return MessageService(db).get_contacts(current_user)


@router.post("/", response_model=MessageOut)
async def create_message(data: MessageCreate, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    service = MessageService(db)

    if current_user.role == "trainee" and data.message_type == "personal":
        recipient = db.query(User).filter(User.id == data.recipient_id).first()
        if not recipient or recipient.role != "trainer":
            raise HTTPException(status_code=403, detail="Trainees can only direct message trainers")

    new_msg = service.create_message(current_user, data)

    payload = {
        "action": "MESSAGE_CREATED",
        "data": {
            "id": str(new_msg.id),
            "content": new_msg.content,
            "sender_name": new_msg.sender_name,
            "sender_id": str(new_msg.sender_id),
            "message_type": new_msg.message_type,
            "is_main": new_msg.is_main,
            "group_id": str(new_msg.group_id) if new_msg.group_id else None,
            "recipient_id": str(new_msg.recipient_id) if new_msg.recipient_id else None,
            "created_at": new_msg.created_at.isoformat()
        }
    }

    if new_msg.message_type == "general":
        await socket_manager.broadcast_to_group(new_msg.group_id, payload)
    else:
        await socket_manager.send_to_user(new_msg.recipient_id, payload)
        await socket_manager.send_to_user(new_msg.sender_id, payload)

    return new_msg


@router.patch("/{message_id}", response_model=MessageOut)
async def update_message(message_id: uuid.UUID, data: MessageUpdate, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    service = MessageService(db)
    db_msg = service.get_message_by_id(message_id)

    if not db_msg or db_msg.sender_id != current_user.id:
        raise HTTPException(status_code=404, detail="Unauthorized or not found")

    updated_msg = service.update_message(db_msg, data.content)

    payload = {
        "action": "MESSAGE_UPDATED",
        "data": {
            "id": str(updated_msg.id),
            "content": updated_msg.content,
            "group_id": str(updated_msg.group_id) if updated_msg.group_id else None,
            "recipient_id": str(updated_msg.recipient_id) if updated_msg.recipient_id else None
        }
    }

    if updated_msg.message_type == "general":
        await socket_manager.broadcast_to_group(updated_msg.group_id, payload)
    else:
        await socket_manager.send_to_user(updated_msg.recipient_id, payload)
        await socket_manager.send_to_user(updated_msg.sender_id, payload)

    return updated_msg


@router.delete("/{message_id}")
async def delete_message(message_id: uuid.UUID, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    service = MessageService(db)
    db_msg = service.get_message_by_id(message_id)

    if not db_msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if db_msg.sender_id != current_user.id and current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    m_type = db_msg.message_type
    g_id = db_msg.group_id
    r_id = db_msg.recipient_id
    s_id = db_msg.sender_id

    service.delete_message(db_msg)

    payload = {
        "action": "MESSAGE_DELETED",
        "data": {"id": str(message_id)}
    }

    if m_type == "general":
        await socket_manager.broadcast_to_group(g_id, payload)
    else:
        await socket_manager.send_to_user(r_id, payload)
        await socket_manager.send_to_user(s_id, payload)

    return {"detail": "Deleted"}


@router.get("/main", response_model=List[MessageOut])
async def get_main_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MessageService(db).get_main_messages(current_user)


@router.get("/history/{target_id}", response_model=List[MessageOut])
async def get_history(target_id: uuid.UUID, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    return MessageService(db).get_chat_history(target_id, current_user)