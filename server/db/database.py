import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.logger import logger  # Integrated our centralized logging engine

# Load environment variables from .env file configuration layer
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("Database connection failure: DATABASE_URL environment variable is missing.")
else:
    logger.info("Initializing relational database connection engine engine pool...")

# Create the core SQLAlchemy engine optimized for PostgreSQL connections
engine = create_engine(DATABASE_URL)
logger.info("SQLAlchemy create_engine successfully established connection pool architectures.")

# Construct a thread-safe local session factory for transactional routing
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Standard Base class for declarative SQLAlchemy object-relational data mapping tables
Base = declarative_base()

def get_db():
    """
    Context-managed dependency that provisions an isolated SQLAlchemy SessionLocal
    instance per inbound HTTP request and guarantees thread cleanup termination on disposal.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()