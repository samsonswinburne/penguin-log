from datetime import date

from conftest import SAMPLE_GAMES
from sqlalchemy import func, select

from app import seed as seed_module
from app.models import Game, Genre
from app.seed import IGDB_GENRES, load_games, seed, seed_if_empty


def count(db, model):
    return db.scalar(select(func.count()).select_from(model))


def test_seed_adds_games_and_genres(sessions):
    with sessions() as db:
        assert seed(db, SAMPLE_GAMES) == 3
        assert count(db, Genre) == len(IGDB_GENRES)

        celeste = db.get(Game, 1)
        assert celeste.release_date == date(2018, 1, 26)
        assert [genre.name for genre in celeste.genres] == ["Indie", "Platform"]

        hollow_knight = db.get(Game, 3)
        assert hollow_knight.release_date is None
        assert hollow_knight.summary == ""


def test_seed_skips_existing_games_and_unknown_genres(sessions):
    with sessions() as db:
        seed(db, SAMPLE_GAMES)
        new_game = {"id": 4, "name": "Mystery", "slug": "mystery", "genres": [999]}
        assert seed(db, [*SAMPLE_GAMES, new_game]) == 1
        assert count(db, Game) == 4
        assert db.get(Game, 4).genres == []


def test_seed_if_empty_only_seeds_once(sessions, monkeypatch):
    monkeypatch.setattr(seed_module, "load_games", lambda: SAMPLE_GAMES)
    with sessions() as db:
        assert seed_if_empty(db) == 3
        assert seed_if_empty(db) == 0
        assert count(db, Game) == 3


def test_bundled_snapshot_is_valid():
    games = load_games()
    assert len(games) == 1000
    assert len({game["id"] for game in games}) == len(games)
    assert len({game["slug"] for game in games}) == len(games)
    assert all(game["name"] for game in games)
    assert {g for game in games for g in game.get("genres", [])} <= IGDB_GENRES.keys()
