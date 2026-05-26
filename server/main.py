import os
import uuid
import uvicorn
from dotenv import load_dotenv

# 1. Critical: Load environment variables BEFORE any other imports.
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Import core infrastructure layers
from db.database import engine, Base, SessionLocal
from cron.tasks import scheduled_cleanup
from core.socket_manager import socket_manager
from core.logger import logger, trace_id_var

# Import Domain Routers (Modular Architecture)
from domains.users.router import router as users_router, auth_router
from domains.groups.router import router as groups_router
from domains.parameters.router import router as parameters_router
from domains.messages.router import router as messages_router
from domains.tags.router import router as tags_router
from domains.exercises.router import router as exercises_router
from domains.templates.router import router as templates_router
from domains.ExerciseLog.router import router as logs_router
from domains.WorkoutSession.router import router as sessions_router


# Synchronize SQLAlchemy models with the database schema
Base.metadata.create_all(bind=engine)


# --- App Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown events, specifically background maintenance schedulers.
    """
    # Allocate background transaction trace for boot logging context
    trace_id_var.set("SYSTEM-BOOT")
    scheduler = AsyncIOScheduler()

    # Schedule daily maintenance: Message cleanup at 03:00 AM
    scheduler.add_job(scheduled_cleanup, 'cron', hour=3, minute=0)

    scheduler.start()
    logger.info("Mitamnim 2 Scheduler started successfully (Maintenance Mode).")

    yield

    scheduler.shutdown()
    logger.info("Mitamnim 2 Scheduler shut down gracefully.")


# --- FastAPI App Configuration ---
app = FastAPI(
    title="Fitness Management System API",
    lifespan=lifespan,
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
    allow_origins=["*"],
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
    # Provision a unique request-scoped runtime trace token context variable
    socket_trace = f"WS-{str(uuid.uuid4())[:8]}"
    trace_id_var.set(socket_trace)

    db = SessionLocal()
    user = None

    try:
        # Pre-Accept Authentication validation tracking
        user = socket_manager.authenticate_websocket(token, db)

        if not user:
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WebSocket pipeline connection rejected: Invalid client token signature.")
            return

        # Explicitly accept connection channel handshake
        await websocket.accept()

        # Track connection node maps dynamically in reference memories
        await socket_manager.connect(user.id, websocket, user.group_id, user.role)
        logger.info(f"WebSocket established successfully. Authenticated identity user context: '{user.username}'")

        try:
            while True:
                # Keep alive runtime blocking loop listening for client network signals
                await websocket.receive_text()
        except WebSocketDisconnect:
            socket_manager.disconnect(user.id, websocket)
            logger.info(f"WebSocket closed gracefully by remote client connection for user: '{user.username}'")
        except Exception as e:
            socket_manager.disconnect(user.id, websocket)
            logger.error(f"Operational pipeline loop disconnect exception caught for user '{user.username}': {str(e)}")

    except Exception as outer_e:
        logger.error(f"Fatal error encountered during WebSocket synchronization handshake: {str(outer_e)}")
    finally:
        db.close()


# --- Router Registration Mapping Layer ---

# Core Identity and Management
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(groups_router)

# Social and Normalized Training Domains
app.include_router(parameters_router)
app.include_router(messages_router)
app.include_router(tags_router)

# exercises
app.include_router(exercises_router)
app.include_router(templates_router)
app.include_router(logs_router)
app.include_router(sessions_router)
@app.get("/")
async def root():
    """Server health status check."""
    return {"status": "healthy", "architecture": "flat-relational-modular"}


if __name__ == "__main__":
    script_name = os.path.basename(__file__).replace(".py", "")
    uvicorn.run(f"{script_name}:app", host="0.0.0.0", port=8000, reload=True)