"""Loads the IGDB Linux games snapshot into the database.

Runs automatically on startup when the games table is empty, so a fresh staging or
production database gets a catalogue without anyone running a manual step. It can
also be run by hand with: python -m app.seed
"""

import json
from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Game, Genre

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "igdb-linux-games.json"

# The snapshot only stores IGDB genre ids, these are IGDB's names for them.
IGDB_GENRES = {
    2: "Point-and-click",
    4: "Fighting",
    5: "Shooter",
    7: "Music",
    8: "Platform",
    9: "Puzzle",
    10: "Racing",
    11: "Real Time Strategy",
    12: "Role-playing",
    13: "Simulator",
    14: "Sport",
    15: "Strategy",
    16: "Turn-based strategy",
    24: "Tactical",
    25: "Hack and slash",
    26: "Quiz/Trivia",
    30: "Pinball",
    31: "Adventure",
    32: "Indie",
    33: "Arcade",
    34: "Visual Novel",
    35: "Card & Board Game",
    36: "MOBA",
}


def load_games(path: Path = DATA_FILE) -> list[dict]:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def seed(db: Session, games: Iterable[dict]) -> int:
    """Adds any games and genres that aren't already stored. Returns how many games were added."""
    genres = {genre.id: genre for genre in db.scalars(select(Genre))}
    for genre_id, name in IGDB_GENRES.items():
        if genre_id not in genres:
            genres[genre_id] = Genre(id=genre_id, name=name)
            db.add(genres[genre_id])

    existing = set(db.scalars(select(Game.id)))
    added = 0
    for item in games:
        if item["id"] in existing:
            continue
        released = item.get("first_release_date")
        db.add(
            Game(
                id=item["id"],
                name=item["name"],
                slug=item["slug"],
                summary=item.get("summary", ""),
                release_date=datetime.fromtimestamp(released, UTC).date() if released is not None else None,
                igdb_url=item.get("url", ""),
                genres=[genres[g] for g in item.get("genres", []) if g in genres],
            )
        )
        existing.add(item["id"])
        added += 1

    db.commit()
    return added


def seed_if_empty(db: Session) -> int:
    if db.scalar(select(func.count()).select_from(Game)):
        return 0
    try:
        return seed(db, load_games())
    except IntegrityError:
        # another backend task seeded the database at the same time
        db.rollback()
        return 0


if __name__ == "__main__":
    from app.database import SessionLocal

    if SessionLocal is None:
        raise SystemExit("Database is not configured, set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD")
    with SessionLocal() as session:
        print(f"Added {seed(session, load_games())} games")
