from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app


def test_database_and_basic_auth():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    sessions = sessionmaker(bind=test_engine)

    def test_db():
        with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = test_db
    try:
        with TestClient(app) as client:
            assert client.get("/api/db/health").json() == {"status": "ok"}

            credentials = {"email": "TEST@example.com", "password": "test-password"}
            created = client.post("/api/auth/register", json=credentials)
            assert created.status_code == 201
            assert created.json() == {"id": 1, "email": "test@example.com"}

            duplicate = client.post("/api/auth/register", json=credentials)
            assert duplicate.status_code == 409

            bad_login = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "wrong-password"},
            )
            assert bad_login.status_code == 401

            login = client.post("/api/auth/login", json=credentials)
            assert login.status_code == 200
            assert login.json() == created.json()
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()
