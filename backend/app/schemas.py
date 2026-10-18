# Response models shared by more than one router.
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class GenreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class GameSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    release_date: date | None
    genres: list[GenreOut]


class GameRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class Author(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rating: int
    comment: str
    created_at: datetime
    updated_at: datetime
    game: GameRef
    user: Author
