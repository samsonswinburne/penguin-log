from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/api/health")
async def health():
    return {"status": "ok"}


@router.get("/api/db/health")
def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable") from None

    return {"status": "ok"}
