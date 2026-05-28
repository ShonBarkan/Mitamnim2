import os
import uuid
from typing import Dict, List, Optional, Any
from fastapi import WebSocket
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.logger import logger

class ConnectionManager:
    """
    Global WebSocket connection manager.
    Handles multiple connections per user to support multi-tab scenarios.
    Driven strictly by the server relational database architecture layer.
    """

    def __init__(self):
        # Structure: { user_id: {"group_id": Optional[uuid.UUID], "role": str, "sockets": [ws1, ws2]} }
        self.active_connections: Dict[uuid.UUID, Dict[str, Any]] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket, group_id: Optional[uuid.UUID], role: str):
        """
        Registers a new socket connection in the active memory registry mapping.
        Note: websocket.accept() must be executed in the endpoint BEFORE calling this.
        """
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {
                "group_id": group_id,
                "role": role,
                "sockets": []
            }
            logger.info(f"WebSocket session registry initialized for user_id: {user_id} in group_id: {group_id}")

        # Append specific socket channel to user list if missing
        if websocket not in self.active_connections[user_id]["sockets"]:
            self.active_connections[user_id]["sockets"].append(websocket)
            logger.info(f"New socket pipeline attached for user_id: {user_id}. Active tabs/sockets count: {len(self.active_connections[user_id]['sockets'])}")

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket):
        """
        Removes a specific socket instance for an active user session context.
        Flushes the root user object mapping entirely if no sockets remain open.
        """
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]["sockets"]:
                self.active_connections[user_id]["sockets"].remove(websocket)
                logger.info(f"Socket pipeline closed and removed for user_id: {user_id}")

            # Garbage collect user node mapping if no concurrent tabs remain connected
            if not self.active_connections[user_id]["sockets"]:
                del self.active_connections[user_id]
                logger.info(f"User_id: {user_id} has no more active socket connections. Purged from live stream manager memory registry.")

    async def send_to_user(self, user_id: uuid.UUID, payload: Any):
        """
        Transmits a JSON payload structure to all connected active sockets for a specific user ID.
        """
        if user_id in self.active_connections:
            sockets = self.active_connections[user_id]["sockets"]
            for ws in list(sockets):
                try:
                    await ws.send_json(payload)
                except Exception as e:
                    logger.error(f"Failed to transmit JSON packet payload to user_id: {user_id} via socket channel: {str(e)}")
                    self.disconnect(user_id, ws)

    async def broadcast_to_group(self, group_id: uuid.UUID, payload: Any):
        """
        Broadcasts a JSON packet payload strictly to users belonging to a specific relational group UUID.
        """
        logger.info(f"Initiating message broadcast channel sequence across group_id: {group_id}")
        for u_id, data in list(self.active_connections.items()):
            if data["group_id"] == group_id:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception as e:
                        logger.error(f"Group broadcast collision encountered for user_id: {u_id} in group_id: {group_id}: {str(e)}")
                        self.disconnect(u_id, ws)

    async def broadcast_to_role(self, role: str, payload: Any):
        """
        Broadcasts a JSON payload out to all active online connections matching a target system role.
        """
        logger.info(f"Initiating message broadcast sequence to system role: {role}")
        for u_id, data in list(self.active_connections.items()):
            if data["role"] == role:
                for ws in list(data["sockets"]):
                    try:
                        await ws.send_json(payload)
                    except Exception as e:
                        logger.error(f"Role broadcast collision encountered for user_id: {u_id} matching role: {role}: {str(e)}")
                        self.disconnect(u_id, ws)

    async def broadcast_all(self, payload: Any):
        """
        Global Emergency broadcast mechanism. Emits a JSON payload to every connection hook in runtime memory.
        """
        logger.info("Executing global broadcast command packet deployment down to all connected network clients.")
        for u_id, data in list(self.active_connections.items()):
            for ws in list(data["sockets"]):
                try:
                    await ws.send_json(payload)
                except Exception as e:
                    logger.error(f"Global system broadcast failed to sync on socket user_id: {u_id}: {str(e)}")
                    self.disconnect(u_id, ws)

    def authenticate_websocket(self, token: str, db: Session) -> Optional[Any]:
        """
        Decodes incoming JWT tokens against server environmental configurations and extracts
        the target user from relational relational mapping query chains.
        """
        secret_key = os.getenv("SECRET_KEY")
        algorithm = os.getenv("ALGORITHM", "HS256")

        if not token or not secret_key:
            logger.warning("WebSocket authentication failed early: Missing token configuration parameters or cryptographic keys.")
            return None

        try:
            payload = jwt.decode(token, secret_key, algorithms=[algorithm])
            username: str = payload.get("sub")
            if not username:
                logger.warning("WebSocket token payload validation error: Missing identity subscription payload fields.")
                return None

            # Local scope isolation import to decouple circular compilation bottlenecks
            from domains.users.models import User
            user = db.query(User).filter(User.username == username).first()
            if not user:
                logger.warning(f"WebSocket auth failed: Authenticated payload user token identity matching user '{username}' could not be located in records.")
            return user

        except JWTError as je:
            logger.error(f"WebSocket client signature verification rejected: Invalid cryptography payload validation sequence: {str(je)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected operational bottleneck occurred during WebSocket encryption authentication: {str(e)}")
            return None


# Instantiated application singleton lifecycle binding unit
socket_manager = ConnectionManager()