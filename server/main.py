import os
import uvicorn
from dotenv import load_dotenv

# 1. Critical: Load environment variables BEFORE any other imports.
# This ensures global availability of configuration like SECRET_KEY.
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Import core infrastructure
from db.database import engine, Base, SessionLocal
from cron.tasks import scheduled_cleanup
from core.socket_manager import socket_manager

# Import Domain Routers (Modular Architecture)
from domains.users import router as users_router, auth_router
from domains.groups import router as groups_router
from domains.messages import router as messages_router
from domains.parameters import router as parameters_router
from domains.exercises import router as exercises_router
from domains.active_params import router as active_params_router
from domains.activities import router as activities_router
from domains.templates import router as templates_router
from domains.workout_sessions import router as workout_sessions_router

# Import Statistics Domain Routers (Real-time architecture)
from domains.stats import router as stats_router
from domains.stats_dashboard_config import router as dashboard_router

# --- Database Initialization ---
# Synchronize SQLAlchemy models with the database schema
Base.metadata.create_all(bind=engine)


# --- App Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown events, specifically background schedulers.
    """
    scheduler = AsyncIOScheduler()

    # Schedule daily maintenance: Message cleanup at 03:00 AM
    scheduler.add_job(scheduled_cleanup, 'cron', hour=3, minute=0)

    # Note: Periodic heavy calculation jobs have been removed.
    # Statistics are now calculated in real-time.

    scheduler.start()
    print("Mitamnim 2 Scheduler started (Maintenance Mode)...")

    yield

    # Shutdown scheduler gracefully on app termination
    scheduler.shutdown()
    print("Mitamnim 2 Scheduler shut down...")


# --- FastAPI App Configuration ---
app = FastAPI(
    title="Fitness Management System API",
    lifespan=lifespan,
    # Disable redirect_slashes to allow manual handling and prevent 307 redirects
    redirect_slashes=False
)

# CORS Configuration for local development and staging environments
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
    Manages WebSocket lifecycle including Auth, Connection Registration, and Heartbeats.
    """
    # Manual DB session for long-lived socket connection scope
    db = SessionLocal()
    user = None

    try:
        # 1. Pre-Accept Authentication: Validate token using the global socket manager
        user = socket_manager.authenticate_websocket(token, db)

        if not user:
            # Reject connection if token is invalid or missing
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 2. Connection Handshake
        await websocket.accept()

        # 3. Registration: Track user ID, group, and role for targeted broadcasts
        await socket_manager.connect(user.id, websocket, user.group_id, user.role)
        print(f"WebSocket: User {user.username} connected successfully.")

        try:
            while True:
                # 4. Listen Loop: Wait for client messages or heartbeats to keep socket alive
                await websocket.receive_text()
        except WebSocketDisconnect:
            # Graceful cleanup on client disconnect
            socket_manager.disconnect(user.id, websocket)
            print(f"WebSocket: User {user.username} disconnected.")
        except Exception as e:
            # Cleanup on unexpected connection errors
            socket_manager.disconnect(user.id, websocket)
            print(f"WebSocket Error for {user.username}: {e}")

    except Exception as outer_e:
        print(f"WebSocket Initial Setup Error: {outer_e}")
    finally:
        # 5. Clean up DB resources immediately
        db.close()


# --- Router Registration ---

# Core Identity and Management
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(groups_router)

# Social and Training Domains
app.include_router(messages_router)
app.include_router(parameters_router)
app.include_router(exercises_router)
app.include_router(active_params_router)
app.include_router(activities_router)
app.include_router(templates_router)
app.include_router(workout_sessions_router)

# Statistics and Analytics Domains (Formulas and Conversions removed)
app.include_router(stats_router)
app.include_router(dashboard_router)


@app.get("/")
async def root():
    """Server health status check."""
    return {"message": "Server is running in modular architecture mode"}


if __name__ == "__main__":
    # Dynamically extract script name for the uvicorn loader
    script_name = os.path.basename(__file__).replace(".py", "")
    uvicorn.run(f"{script_name}:app", host="0.0.0.0", port=8000, reload=True)