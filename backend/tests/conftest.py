# The staging workflow runs tests/integration from the repo root with only pytest and
# httpx installed, and pytest loads this file for those tests too. Keep app, FastAPI and
# SQLAlchemy imports inside the fixtures so collecting the integration tests still works.
import pytest

SAMPLE_GAMES = [
    {
        "id": 1,
        "name": "Celeste",
        "slug": "celeste",
        "summary": "Climb a mountain.",
        "first_release_date": 1516924800,
        "genres": [8, 32],
        "url": "https://www.igdb.com/games/celeste",
    },
    {
        "id": 2,
        "name": "Baldur's Gate",
        "slug": "baldur-s-gate",
        "summary": "A fantasy RPG.",
        "first_release_date": 914198400,
        "genres": [12],
        "url": "https://www.igdb.com/games/baldur-s-gate",
    },
    {
        "id": 3,
        "name": "Hollow Knight",
        "slug": "hollow-knight",
        "genres": [8, 31, 32],
        "url": "https://www.igdb.com/games/hollow-knight",
    },
]


@pytest.fixture
def sessions():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.database import Base

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    try:
        yield sessionmaker(bind=engine)
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(sessions):
    """A test client for the API backed by an in-memory database holding SAMPLE_GAMES."""
    from fastapi.testclient import TestClient

    from app.database import get_db
    from app.seed import seed
    from main import app

    with sessions() as db:
        seed(db, SAMPLE_GAMES)

    def test_db():
        with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = test_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def sign_in(client):
    """Registers a user and returns the headers to make requests as them."""

    def sign_in_as(email: str) -> dict[str, str]:
        credentials = {"email": email, "password": "test-password"}
        assert client.post("/api/auth/register", json=credentials).status_code == 201
        token = client.post("/api/auth/login", json=credentials).json()["token"]
        return {"Authorization": f"Bearer {token}"}

    return sign_in_as
