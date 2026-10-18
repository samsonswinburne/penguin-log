from datetime import UTC, date, datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))

    profile: Mapped["Profile | None"] = relationship(lazy="joined")

    @property
    def display_name(self) -> str:
        if self.profile and self.profile.display_name:
            return self.profile.display_name
        return f"Penguin {self.id}"


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[int]


# Kept out of the users table so create_all can add it to databases that already exist.
class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(50), default="")
    bio: Mapped[str] = mapped_column(Text, default="")


class Genre(Base):
    __tablename__ = "genres"

    # ids match IGDB so the seed file can reference them directly
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(String(100), unique=True)


game_genres = Table(
    "game_genres",
    Base.metadata,
    Column("game_id", ForeignKey("games.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    release_date: Mapped[date | None]
    igdb_url: Mapped[str] = mapped_column(String(255), default="")

    genres: Mapped[list[Genre]] = relationship(secondary=game_genres, lazy="selectin", order_by=Genre.name)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id"),
        CheckConstraint("rating BETWEEN 1 AND 10", name="rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True)
    rating: Mapped[int]
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped[User] = relationship(lazy="joined")
    game: Mapped[Game] = relationship(lazy="joined")


# Favourites and the "want to play" backlog are both just a user's list of games.
class ListEntry(Base):
    __tablename__ = "list_entries"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    list_name: Mapped[str] = mapped_column(String(20), primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    game: Mapped[Game] = relationship(lazy="joined")
