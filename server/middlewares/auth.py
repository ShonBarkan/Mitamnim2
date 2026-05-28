import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

from db.database import get_db
from core.logger import logger  # Integrated our centralized logging engine

# --- Environment Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    logger.error(
        "Authentication Core Security Failure: SECRET_KEY environment variable is missing. Tokens cannot be securely signed.")

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
        """Initializes the service with an active relational database session."""
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Compares a plain text password with a hashed password stored in the DB.
        """
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """
        Generates a secure bcrypt hash from a plain text password.
        Used during user registration or operational password overrides.
        """
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Generates a secure, cryptographically signed JSON Web Token (JWT).
        """
        to_encode = data.copy()

        # Modern Python timezone-aware UTC computation to avoid legacy naive utcnow deprecations
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

        # Stripping timezone info to map smoothly with standard database TIMESTAMP WITHOUT TIME ZONE columns
        to_encode.update({"exp": expire.replace(tzinfo=None)})

        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    async def authenticate_user(self, form_data: OAuth2PasswordRequestForm) -> Optional[dict]:
        """
        Validates user credentials against relational persistence queries
        and issues signed encryption access keys upon validation success.
        """
        from domains.users.models import User

        user = self.db.query(User).filter(User.username == form_data.username).first()

        if not user or not self.verify_password(form_data.password, user.password):
            logger.warning(
                f"Failed authentication vector attempt for username reference payload: '{form_data.username}'")
            return None

        # Synchronize tracking context state timestamps matching our relational columns schema
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

        logger.info(
            f"User '{user.username}' successfully authenticated. Generating cryptographic session token key structure.")

        access_token = self.create_access_token(
            data={"sub": user.username, "role": user.role}
        )
        return {"access_token": access_token, "token_type": "bearer"}


# --- FastAPI Security Injection Dependencies ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    A reusable security injection dependency layer used to guard private system route channels.
    Extracts, decodes, and traces inbound token signatures against user accounts.
    """
    from domains.users.models import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("JWT validation failed early: Token payload 'sub' claim identity key is missing.")
            raise credentials_exception
    except JWTError as je:
        logger.warning(f"Inbound authorization signature rejected due to JWT encoding failure: {str(je)}")
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        logger.warning(
            f"JWT signature is structurally valid but matching user record context '{username}' does not exist.")
        raise credentials_exception

    return user