from hashlib import sha256
from secrets import token_urlsafe
from time import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuthToken, User

TOKEN_LIFETIME_SECONDS = 24 * 60 * 60
bearer = HTTPBearer(auto_error=False)
router = APIRouter(prefix="/api/auth")


class Credentials(BaseModel):
    email: str = Field(min_length=10, max_length=255)
    password: str = Field(min_length=10, max_length=255)


class UserResponse(BaseModel):
    id: int
    email: str


class LoginResponse(UserResponse):
    token: str
    expires_at: int


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not signed in")
    token_hash = sha256(credentials.credentials.encode()).hexdigest()
    auth_token = db.scalar(select(AuthToken).where(AuthToken.token_hash == token_hash))
    if auth_token is None or auth_token.expires_at <= int(time()):
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    user = db.get(User, auth_token.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(credentials: Credentials, db: Session = Depends(get_db)):
    user = User(email=credentials.email.strip().lower(), password=credentials.password)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered") from None
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(credentials: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == credentials.email.strip().lower()))
    if user is None or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = token_urlsafe(32)
    expires_at = int(time()) + TOKEN_LIFETIME_SECONDS
    auth_token = db.get(AuthToken, user.id)
    if auth_token is None:
        db.add(
            AuthToken(
                user_id=user.id,
                token_hash=sha256(token.encode()).hexdigest(),
                expires_at=expires_at,
            )
        )
    else:
        auth_token.token_hash = sha256(token.encode()).hexdigest()
        auth_token.expires_at = expires_at
    db.commit()
    return LoginResponse(id=user.id, email=user.email, token=token, expires_at=expires_at)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(current_user), db: Session = Depends(get_db)):
    auth_token = db.get(AuthToken, user.id)
    if auth_token is not None:
        db.delete(auth_token)
        db.commit()
