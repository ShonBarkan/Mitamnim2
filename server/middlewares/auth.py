import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

from db.database import get_db

# --- Environment Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# --- Security Global Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- Pydantic Schemas for Authentication ---

class Token(BaseModel):
    """Schema representing the successful authentication response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema representing the data extracted from the JWT payload."""
    username: Optional[str] = None


# --- AuthService: Core Authentication Logic ---

class AuthService:
    """
    A service class dedicated to handling authentication-related business logic.
    Encapsulates password verification, hashing, and token generation.
    """

    def __init__(self, db: Session):
        """Initializes the service with a database session."""
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Compares a plain text password with a hashed password stored in the DB.
        Returns: True if they match, False otherwise.
        """
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """
        Generates a secure bcrypt hash from a plain text password.
        Used during user creation or password updates.
        """
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Generates a JSON Web Token (JWT).
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})

        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    async def authenticate_user(self, form_data: OAuth2PasswordRequestForm):
        """
        Validates user credentials and generates an access token upon success.
        """
        # Local import to prevent circular dependency with domains.users
        from domains.users.models import User

        user = self.db.query(User).filter(User.username == form_data.username).first()

        if not user or not self.verify_password(form_data.password, user.password):
            return None

        # Record the login event in the database
        user.last_login = datetime.utcnow()
        self.db.commit()

        # Prepare payload for the JWT
        access_token = self.create_access_token(
            data={"sub": user.username, "role": user.role}
        )
        return {"access_token": access_token, "token_type": "bearer"}


# --- FastAPI Dependencies ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    A reusable dependency to secure routes.
    It extracts the JWT from the request, validates it, and fetches the user from the DB.
    """
    # Local import to prevent circular dependency with domains.users
    from domains.users.models import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT token to extract the payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Final check: Ensure the user still exists in our records
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user