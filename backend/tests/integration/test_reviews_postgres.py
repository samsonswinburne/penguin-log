import os
from uuid import uuid4

import httpx
import pytest


@pytest.fixture
def api():
    base_url = os.getenv("INTEGRATION_BASE_URL")
    if not base_url:
        pytest.skip("Set INTEGRATION_BASE_URL to run against a PostgreSQL-backed API")
    with httpx.Client(base_url=base_url, timeout=10) as client:
        yield client


def signed_in(api: httpx.Client) -> tuple[int, dict[str, str]]:
    credentials = {"email": f"integration-{uuid4().hex}@example.test", "password": "test-password-123"}
    user_id = api.post("/api/auth/register", json=credentials).json()["id"]
    token = api.post("/api/auth/login", json=credentials).json()["token"]
    return user_id, {"Authorization": f"Bearer {token}"}


def test_catalogue_is_seeded(api):
    genres = api.get("/api/genres").json()
    assert len(genres) > 0

    platformers = api.get("/api/games", params={"genre": 8, "limit": 5}).json()
    assert platformers["total"] > 0
    assert all(any(g["id"] == 8 for g in game["genres"]) for game in platformers["items"])


def test_review_lifecycle_is_stored_in_postgres(api):
    user_id, headers = signed_in(api)
    game = api.get("/api/games", params={"limit": 1}).json()["items"][0]
    comment = f"Integration review {uuid4().hex}"

    created = api.post("/api/reviews", json={"game_id": game["id"], "rating": 8, "comment": comment}, headers=headers)
    assert created.status_code == 201
    review_id = created.json()["id"]
    assert api.post(
        "/api/reviews", json={"game_id": game["id"], "rating": 8, "comment": comment}, headers=headers
    ).status_code == 409

    on_game = [r for r in api.get(f"/api/games/{game['id']}").json()["reviews"] if r["id"] == review_id]
    assert on_game[0]["comment"] == comment

    updated = api.put(f"/api/reviews/{review_id}", json={"rating": 3, "comment": "Changed"}, headers=headers)
    assert updated.status_code == 200
    profile = api.get(f"/api/users/{user_id}").json()
    assert [(r["id"], r["rating"], r["comment"]) for r in profile["reviews"]] == [(review_id, 3, "Changed")]

    assert api.delete(f"/api/reviews/{review_id}", headers=headers).status_code == 204
    assert api.get(f"/api/users/{user_id}").json()["reviews"] == []


def test_profile_and_lists_are_stored_in_postgres(api):
    user_id, headers = signed_in(api)
    game_id = api.get("/api/games", params={"limit": 1}).json()["items"][0]["id"]

    update = api.put("/api/me/profile", json={"display_name": "Integration Tux", "bio": "Hi"}, headers=headers)
    assert update.status_code == 200
    assert api.put(f"/api/me/favourites/{game_id}", headers=headers).status_code == 204
    assert api.put(f"/api/me/backlog/{game_id}", headers=headers).status_code == 204

    profile = api.get(f"/api/users/{user_id}").json()
    assert profile["display_name"] == "Integration Tux"
    assert profile["bio"] == "Hi"
    assert [g["id"] for g in profile["favourites"]] == [game_id]
    assert [g["id"] for g in profile["backlog"]] == [game_id]

    assert api.delete(f"/api/me/backlog/{game_id}", headers=headers).status_code == 204
    assert api.get(f"/api/me/games/{game_id}", headers=headers).json() == {
        "review": None,
        "favourite": True,
        "backlog": False,
    }
