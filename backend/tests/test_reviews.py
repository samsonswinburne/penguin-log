import pytest

REVIEW = {"game_id": 1, "rating": 9, "comment": "  Tough but fair.  "}


def test_create_review(client, sign_in):
    headers = sign_in("reviewer@example.com")
    response = client.post("/api/reviews", json=REVIEW, headers=headers)

    assert response.status_code == 201
    review = response.json()
    assert review["rating"] == 9
    assert review["comment"] == "Tough but fair."
    assert review["game"] == {"id": 1, "name": "Celeste"}
    assert review["user"] == {"id": 1, "display_name": "Penguin 1"}


def test_creating_a_review_requires_sign_in(client):
    assert client.post("/api/reviews", json=REVIEW).status_code == 401


def test_one_review_per_game(client, sign_in):
    headers = sign_in("reviewer@example.com")
    assert client.post("/api/reviews", json=REVIEW, headers=headers).status_code == 201
    assert client.post("/api/reviews", json=REVIEW, headers=headers).status_code == 409


def test_review_unknown_game(client, sign_in):
    headers = sign_in("reviewer@example.com")
    response = client.post("/api/reviews", json={**REVIEW, "game_id": 999}, headers=headers)
    assert response.status_code == 404


@pytest.mark.parametrize(
    "change",
    [{"rating": 0}, {"rating": 11}, {"comment": ""}, {"comment": "x" * 5001}, {"game_id": None}],
)
def test_invalid_reviews_are_rejected(client, sign_in, change):
    headers = sign_in("reviewer@example.com")
    assert client.post("/api/reviews", json={**REVIEW, **change}, headers=headers).status_code == 422


def test_update_own_review(client, sign_in):
    headers = sign_in("reviewer@example.com")
    review_id = client.post("/api/reviews", json=REVIEW, headers=headers).json()["id"]

    response = client.put(f"/api/reviews/{review_id}", json={"rating": 7, "comment": "Changed my mind"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["rating"] == 7
    assert response.json()["comment"] == "Changed my mind"
    assert client.get("/api/games/1").json()["reviews"][0]["rating"] == 7


def test_delete_own_review(client, sign_in):
    headers = sign_in("reviewer@example.com")
    review_id = client.post("/api/reviews", json=REVIEW, headers=headers).json()["id"]

    assert client.delete(f"/api/reviews/{review_id}", headers=headers).status_code == 204
    assert client.get("/api/games/1").json()["reviews"] == []
    assert client.delete(f"/api/reviews/{review_id}", headers=headers).status_code == 404


def test_cannot_change_someone_elses_review(client, sign_in):
    review_id = client.post("/api/reviews", json=REVIEW, headers=sign_in("owner@example.com")).json()["id"]
    other = sign_in("other@example.com")

    update = {"rating": 1, "comment": "Vandalised"}
    assert client.put(f"/api/reviews/{review_id}", json=update, headers=other).status_code == 403
    assert client.delete(f"/api/reviews/{review_id}", headers=other).status_code == 403
    assert client.get("/api/games/1").json()["reviews"][0]["rating"] == 9


def test_changing_reviews_requires_sign_in(client):
    assert client.put("/api/reviews/1", json={"rating": 5, "comment": "Hi"}).status_code == 401
    assert client.delete("/api/reviews/1").status_code == 401
