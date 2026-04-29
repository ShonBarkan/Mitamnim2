import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine
# "check_same_thread" is only needed for SQLite. For PostgreSQL, it's not required.
engine = create_engine(DATABASE_URL)

# Construct a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Standard Base class for SQLAlchemy models
Base = declarative_base()

def get_db():
    """
    Dependency that creates a new SQLAlchemy SessionLocal for each request
    and ensures it is closed once the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()