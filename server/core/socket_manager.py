import os
import uuid
import asyncio
from typing import Dict, List, Optional, Any
from fastapi import WebSocket
from jose import jwt, JWTError
from sqlalchemy.orm import Session


class ConnectionManager:
    """
    מנהל חיבורי WebSocket גלובלי.
    תומך בחיבורים מרובים לאותו משתמש (כמה טאבים פתוחים במקביל).
    """

    def __init__(self):
        # מבנה הנתונים החדש: { user_id: {"group_id": str, "role": str, "sockets": [ws1, ws2]} }
        self.active_connections: Dict[uuid.UUID, Dict[str, Any]] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket, group_id: Any, role: str):
        """רישום חיבור חדש."""
        await websocket.accept()

        group_id_str = str(group_id) if group_id else None

        if user_id not in self.active_connections:
            self.active_connections[user_id] = {
                "group_id": group_id_str,
                "role": role,
                "sockets": []
            }

        self.active_connections[user_id]["sockets"].append(websocket)

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket):
        """הסרת חיבור ספציפי של משתמש."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]["sockets"]:
                self.active_connections[user_id]["sockets"].remove(websocket)

            # אם לא נשארו סוקטים פעילים למשתמש, נמחק את כל הערך
            if not self.active_connections[user_id]["sockets"]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: uuid.UUID, payload: Any):
        """שליחת הודעה לכל המכשירים/טאבים הפתוחים של משתמש ספציפי."""
        if user_id in self.active_connections:
            sockets = self.active_connections[user_id]["sockets"]
            # עוברים על רשימה מועתקת כדי לאפשר הסרה בזמן ריצה אם השליחה נכשלת
            for ws in list(sockets):
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(user_id, ws)

    async def broadcast_to_group(self, group_id: Any, payload: Any):
        """שליחה לכל חברי קבוצה מסוימת."""
        target_group = str(group_id) if group_id else None

        for u_id, data in list(self.active_connections.items()):
            if data["group_id"] == target_group:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        self.disconnect(u_id, ws)

    async def broadcast_to_role(self, role: str, payload: Any):
        """שליחה לכל המשתמשים בעלי תפקיד מסוים."""
        for u_id, data in list(self.active_connections.items()):
            if data["role"] == role:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        self.disconnect(u_id, ws)

    async def broadcast_all(self, payload: Any):
        """הודעה מתפרצת לכל המשתמשים המחוברים במערכת."""
        for u_id, data in list(self.active_connections.items()):
            for ws in list(data["sockets"]):
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(u_id, ws)

    def authenticate_websocket(self, token: str, db: Session) -> Any:
        """אימות JWT ושליפת המשתמש מה-DB."""
        secret_key = os.getenv("SECRET_KEY")
        algorithm = os.getenv("ALGORITHM", "HS256")

        if not token or not secret_key:
            return None

        try:
            payload = jwt.decode(token, secret_key, algorithms=[algorithm])
            username: str = payload.get("sub")
            if not username:
                return None

            from domains.users import User
            return db.query(User).filter(User.username == username).first()

        except (JWTError, Exception):
            return None


socket_manager = ConnectionManager()