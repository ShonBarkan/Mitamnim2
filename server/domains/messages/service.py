import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Message, MessageCreate, MessageUpdate


# --- MessageService (Business Logic) ---

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def get_message_by_id(self, message_id: uuid.UUID) -> Optional[Message]:
        return self.db.query(Message).filter(Message.id == message_id).first()

    def get_messages_for_user(self, user_id: uuid.UUID) -> List[Message]:
        """Get all messages where user is sender or recipient."""
        return self.db.query(Message).filter(
            (Message.sender_id == user_id) | (Message.recipient_id == user_id)
        ).order_by(Message.created_at.desc()).all()

    def get_group_messages(self, group_id: uuid.UUID) -> List[Message]:
        """Get all messages for a specific group."""
        return self.db.query(Message).filter(
            Message.group_id == group_id
        ).order_by(Message.created_at.desc()).all()

    def get_personal_messages_between_users(self, user1_id: uuid.UUID, user2_id: uuid.UUID) -> List[Message]:
        """Get personal messages between two users."""
        return self.db.query(Message).filter(
            ((Message.sender_id == user1_id) & (Message.recipient_id == user2_id)) |
            ((Message.sender_id == user2_id) & (Message.recipient_id == user1_id))
        ).order_by(Message.created_at.asc()).all()

    def create_message(self, message_data: MessageCreate, sender_id: uuid.UUID) -> Message:
        new_message = Message(
            id=uuid.uuid4(),
            sender_id=sender_id,
            **message_data.model_dump()
        )
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        return new_message

    def update_message(self, db_message: Message, update_data: MessageUpdate) -> Message:
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_message, key, value)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def delete_message(self, db_message: Message):
        self.db.delete(db_message)
        self.db.commit()

    def get_main_messages(self, group_id: uuid.UUID) -> List[Message]:
        """Get main/sticky messages for the group."""
        return self.db.query(Message).filter(
            Message.group_id == group_id,
            Message.is_main == True
        ).order_by(Message.created_at.desc()).all()

    def get_contacts(self, current_user) -> List[dict]:
        """Get authorized contacts for the user."""
        from ..users.models import User
        users = self.db.query(User).filter(User.group_id == current_user.group_id).all()
        contacts = []
        for user in users:
            if current_user.role == "trainee":
                if user.role == "trainer":
                    contacts.append({
                        "id": user.id,
                        "first_name": user.first_name,
                        "second_name": user.second_name,
                        "role": user.role
                    })
            elif current_user.role == "trainer":
                if user.role in ["trainee", "trainer"]:
                    contacts.append({
                        "id": user.id,
                        "first_name": user.first_name,
                        "second_name": user.second_name,
                        "role": user.role
                    })
            else:  # admin
                contacts.append({
                    "id": user.id,
                    "first_name": user.first_name,
                    "second_name": user.second_name,
                    "role": user.role
                })
        return contacts

    def get_history(self, target_id: uuid.UUID, current_user) -> List[Message]:
        """Get message history for a target (group or user)."""
        from ..groups.models import Group
        group = self.db.query(Group).filter(Group.id == target_id).first()
        if group and group.id == current_user.group_id:
            # Group messages
            return self.get_group_messages(target_id)
        else:
            # Personal messages with the user
            return self.get_personal_messages_between_users(current_user.id, target_id)
