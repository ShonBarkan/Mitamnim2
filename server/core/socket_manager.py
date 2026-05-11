import os
import uuid
from typing import Dict, List, Optional, Any
from fastapi import WebSocket
from jose import jwt, JWTError
from sqlalchemy.orm import Session

class ConnectionManager:
    """
    Global WebSocket connection manager.
    Handles multiple connections per user to support multi-tab scenarios.
    """

    def __init__(self):
        # Structure: { user_id: {"group_id": str, "role": str, "sockets": [ws1, ws2]} }
        self.active_connections: Dict[uuid.UUID, Dict[str, Any]] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket, group_id: Any, role: str):
        """
        Registers a new socket connection in the active registry.
        Note: websocket.accept() must be called in the endpoint BEFORE calling this.
        """
        group_id_str = str(group_id) if group_id else None

        if user_id not in self.active_connections:
            self.active_connections[user_id] = {
                "group_id": group_id_str,
                "role": role,
                "sockets": []
            }

        # Add the specific socket to the user's socket list if not already present
        if websocket not in self.active_connections[user_id]["sockets"]:
            self.active_connections[user_id]["sockets"].append(websocket)

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket):
        """
        Removes a specific socket connection for a user.
        If no sockets remain for the user, the user entry is removed from the registry.
        """
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]["sockets"]:
                self.active_connections[user_id]["sockets"].remove(websocket)

            # Cleanup: remove the user entirely if they have no active tabs/sockets
            if not self.active_connections[user_id]["sockets"]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: uuid.UUID, payload: Any):
        """
        Sends a JSON payload to all active sockets belonging to a specific user.
        """
        if user_id in self.active_connections:
            sockets = self.active_connections[user_id]["sockets"]
            for ws in list(sockets):
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(user_id, ws)

    async def broadcast_to_group(self, group_id: Any, payload: Any):
        """
        Broadcasts a JSON payload to all users belonging to a specific group.
        """
        target_group = str(group_id) if group_id else None

        for u_id, data in list(self.active_connections.items()):
            if data["group_id"] == target_group:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        self.disconnect(u_id, ws)

    async def broadcast_to_role(self, role: str, payload: Any):
        """
        Broadcasts a JSON payload to all users with a specific role (e.g., 'trainer').
        """
        for u_id, data in list(self.active_connections.items()):
            if data["role"] == role:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        self.disconnect(u_id, ws)

    async def broadcast_all(self, payload: Any):
        """
        Broadcasts a JSON payload to every single connected user in the system.
        """
        for u_id, data in list(self.active_connections.items()):
            for ws in list(data["sockets"]):
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(u_id, ws)

    def authenticate_websocket(self, token: str, db: Session) -> Any:
        """
        Verifies the JWT token and retrieves the User object from the database.
        Returns the User object if successful, otherwise returns None.
        """
        secret_key = os.getenv("SECRET_KEY")
        algorithm = os.getenv("ALGORITHM", "HS256")

        if not token or not secret_key:
            return None

        try:
            payload = jwt.decode(token, secret_key, algorithms=[algorithm])
            username: str = payload.get("sub")
            if not username:
                return None

            # Local import within method to avoid potential circular dependency issues
            from domains.users.models import User
            return db.query(User).filter(User.username == username).first()

        except (JWTError, Exception):
            return None

# Singleton instance for application-wide use
socket_manager = ConnectionManager()