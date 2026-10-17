import os
from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


def database_url() -> str | URL | None:
    if url := os.getenv("DATABASE_URL"):
        return url

    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    if not all((host, user, password)):
        return None

    return URL.create(
        "postgresql+psycopg",
        username=user,
        password=password,
        host=host,
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "penguinlog"),
    )


url = database_url()
engine = create_engine(url, pool_pre_ping=True) if url else None
SessionLocal = sessionmaker(bind=engine) if engine else None


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database is not configured")
    with SessionLocal() as session:
        yield session
