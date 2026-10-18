# Routes that change the signed-in user's own profile and game lists.
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.database import get_db
from app.models import Game, ListEntry, Profile, Review, User
from app.schemas import ReviewOut

router = APIRouter(prefix="/api/me")

ListName = Literal["favourites", "backlog"]


class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    bio: str = Field(default="", max_length=1000)


class ProfileOut(BaseModel):
    id: int
    display_name: str
    bio: str


class GameState(BaseModel):
    review: ReviewOut | None
    favourite: bool
    backlog: bool


@router.put("/profile", response_model=ProfileOut)
def update_profile(body: ProfileUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    profile = user.profile or Profile(user_id=user.id)
    profile.display_name = body.display_name.strip()
    profile.bio = body.bio.strip()
    db.add(profile)
    db.commit()
    return ProfileOut(id=user.id, display_name=profile.display_name, bio=profile.bio)


@router.get("/games/{game_id}", response_model=GameState)
def game_state(game_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    lists = set(
        db.scalars(select(ListEntry.list_name).where(ListEntry.user_id == user.id, ListEntry.game_id == game_id))
    )
    return GameState(
        review=db.scalar(select(Review).where(Review.user_id == user.id, Review.game_id == game_id)),
        favourite="favourites" in lists,
        backlog="backlog" in lists,
    )


@router.put("/{list_name}/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_to_list(
    list_name: ListName, game_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if db.get(Game, game_id) is None:
        raise HTTPException(status_code=404, detail="Game not found")
    if db.get(ListEntry, (user.id, list_name, game_id)) is None:
        db.add(ListEntry(user_id=user.id, list_name=list_name, game_id=game_id))
        db.commit()


@router.delete("/{list_name}/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_list(
    list_name: ListName, game_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    entry = db.get(ListEntry, (user.id, list_name, game_id))
    if entry is not None:
        db.delete(entry)
        db.commit()
