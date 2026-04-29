import os
import uvicorn
from dotenv import load_dotenv

# 1. Critical: Load environment variables BEFORE any other imports
# This ensures SECRET_KEY and other env vars are available globally.
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Import infrastructure
from db.database import engine, Base, SessionLocal
from cron.tasks import scheduled_cleanup
from core.socket_manager import socket_manager

# Import Domain Routers
from domains.users import router as users_router, auth_router
from domains.groups import router as groups_router
from domains.messages import router as messages_router
from domains.parameters import router as parameters_router
from domains.exercises import router as exercises_router
from domains.active_params import router as active_params_router
from domains.activities import router as activities_router
from domains.templates import router as templates_router
from domains.workout_sessions import router as workout_sessions_router

# --- Database Initialization ---
# Create tables if they do not exist in the database
Base.metadata.create_all(bind=engine)


# --- App Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events, including the background task scheduler.
    """
    scheduler = AsyncIOScheduler()

    # Schedule message cleanup daily at 03:00 AM
    scheduler.add_job(scheduled_cleanup, 'cron', hour=3, minute=0)

    scheduler.start()
    print("Mitamnim 2 Scheduler started...")

    yield

    # Shutdown scheduler on app termination
    scheduler.shutdown()
    print("Mitamnim 2 Scheduler shut down...")


# --- FastAPI App Configuration ---
app = FastAPI(
    title="Fitness Management System API",
    lifespan=lifespan,
    # Disable automatic redirect to handle trailing slashes manually and avoid 307 errors
    redirect_slashes=False
)

# CORS Configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    """
    Handles real-time WebSocket lifecycle: Authentication -> Accept -> Registration -> Listen.
    """
    # Create a manual DB session for this long-lived connection
    db = SessionLocal()
    user = None

    try:
        # 1. Authenticate user using the token BEFORE accepting the connection
        user = socket_manager.authenticate_websocket(token, db)

        if not user:
            # Reject if authentication fails. Accept first to send the close code.
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 2. Accept the connection (Exactly once)
        await websocket.accept()

        # 3. Register the connection in the global manager
        await socket_manager.connect(user.id, websocket, user.group_id, user.role)
        print(f"WebSocket: User {user.username} connected and registered.")

        try:
            while True:
                # 4. Keep alive: Wait for incoming data or heartbeats
                # This prevents the function from returning and closing the socket
                await websocket.receive_text()
        except WebSocketDisconnect:
            # Clean up when client disconnects
            socket_manager.disconnect(user.id, websocket)
            print(f"WebSocket: User {user.username} disconnected.")
        except Exception as e:
            # Catch unexpected socket errors
            socket_manager.disconnect(user.id, websocket)
            print(f"WebSocket Error for {user.username}: {e}")

    except Exception as outer_e:
        print(f"WebSocket Setup Error: {outer_e}")
    finally:
        # 5. Always close the DB session to prevent memory leaks
        db.close()

# --- Register Routes ---
# All domain-specific routers are registered here
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(groups_router)
app.include_router(messages_router)
app.include_router(parameters_router)
app.include_router(exercises_router)
app.include_router(active_params_router)
app.include_router(activities_router)
app.include_router(templates_router)
app.include_router(workout_sessions_router)


@app.get("/")
async def root():
    """Basic health check endpoint."""
    return {"message": "Server is running in modular architecture mode"}


if __name__ == "__main__":
    # Dynamically resolve the script name for uvicorn reloader
    script_name = os.path.basename(__file__).replace(".py", "")
    uvicorn.run(f"{script_name}:app", host="0.0.0.0", port=8000, reload=True)