from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Game, Genre, Review
from app.schemas import GameSummary, ReviewOut

router = APIRouter(prefix="/api/games")


class GamePage(BaseModel):
    items: list[GameSummary]
    total: int


class GameDetail(GameSummary):
    summary: str
    igdb_url: str
    average_rating: float | None
    review_count: int
    reviews: list[ReviewOut]


@router.get("", response_model=GamePage)
def list_games(
    genre: int | None = None,
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(Game)
    if genre is not None:
        query = query.where(Game.genres.any(Genre.id == genre))
    if q and q.strip():
        query = query.where(Game.name.ilike(f"%{q.strip()}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(query.order_by(Game.name, Game.id).limit(limit).offset(offset)).all()
    return GamePage(items=items, total=total or 0)


@router.get("/{game_id}", response_model=GameDetail)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    reviews = db.scalars(
        select(Review).where(Review.game_id == game_id).order_by(Review.created_at.desc(), Review.id.desc())
    ).all()
    ratings = [review.rating for review in reviews]
    return GameDetail(
        **GameSummary.model_validate(game).model_dump(),
        summary=game.summary,
        igdb_url=game.igdb_url,
        average_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
        review_count=len(ratings),
        reviews=reviews,
    )
