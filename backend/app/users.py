from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ListEntry, Review, User
from app.schemas import GameSummary, ReviewOut

router = APIRouter(prefix="/api/users")


class PublicProfile(BaseModel):
    id: int
    display_name: str
    bio: str
    reviews: list[ReviewOut]
    favourites: list[GameSummary]
    backlog: list[GameSummary]


def list_games(db: Session, user_id: int, list_name: str):
    entries = db.scalars(
        select(ListEntry)
        .where(ListEntry.user_id == user_id, ListEntry.list_name == list_name)
        .order_by(ListEntry.added_at.desc(), ListEntry.game_id)
    ).all()
    return [entry.game for entry in entries]


@router.get("/{user_id}", response_model=PublicProfile)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    reviews = db.scalars(
        select(Review).where(Review.user_id == user_id).order_by(Review.created_at.desc(), Review.id.desc())
    ).all()
    return PublicProfile(
        id=user.id,
        display_name=user.display_name,
        bio=user.profile.bio if user.profile else "",
        reviews=reviews,
        favourites=list_games(db, user_id, "favourites"),
        backlog=list_games(db, user_id, "backlog"),
    )
