from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import current_user
from app.database import get_db
from app.models import Game, Review, User
from app.schemas import ReviewOut

router = APIRouter(prefix="/api/reviews")


class ReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=10)
    comment: str = Field(min_length=1, max_length=5000)


class ReviewCreate(ReviewUpdate):
    game_id: int


def own_review(review_id: int, user: User, db: Session) -> Review:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only change your own reviews")
    return review


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(body: ReviewCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if db.get(Game, body.game_id) is None:
        raise HTTPException(status_code=404, detail="Game not found")

    review = Review(user_id=user.id, game_id=body.game_id, rating=body.rating, comment=body.comment.strip())
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this game") from None
    db.refresh(review)
    return review


@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int, body: ReviewUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    review = own_review(review_id, user, db)
    review.rating = body.rating
    review.comment = body.comment.strip()
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(own_review(review_id, user, db))
    db.commit()
