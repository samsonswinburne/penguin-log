from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User


@asynccontextmanager
async def lifespan(_: FastAPI):
    if engine is not None:
        Base.metadata.create_all(bind=engine)
    yield


class Credentials(BaseModel):
    email: str = Field(min_length=10, max_length=255)
    password: str = Field(min_length=10, max_length=255)


class UserResponse(BaseModel):
    id: int
    email: str


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/db/health")
def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
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


@app.post("/api/auth/login", response_model=UserResponse)
def login(credentials: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == credentials.email.strip().lower()))
    if user is None or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
