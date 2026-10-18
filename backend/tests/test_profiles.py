import pytest


def test_new_user_has_default_profile(client, sign_in):
    sign_in("penguin@example.com")
    assert client.get("/api/users/1").json() == {
        "id": 1,
        "display_name": "Penguin 1",
        "bio": "",
        "reviews": [],
        "favourites": [],
        "backlog": [],
    }


def test_unknown_user_is_404(client):
    assert client.get("/api/users/999").status_code == 404


def test_update_profile(client, sign_in):
    headers = sign_in("penguin@example.com")
    body = {"display_name": " Tux ", "bio": " I play everything on Linux. "}
    response = client.put("/api/me/profile", json=body, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"id": 1, "display_name": "Tux", "bio": "I play everything on Linux."}

    assert client.put("/api/me/profile", json={"display_name": "Tux 2"}, headers=headers).status_code == 200
    profile = client.get("/api/users/1").json()
    assert profile["display_name"] == "Tux 2"
    assert profile["bio"] == ""


@pytest.mark.parametrize("body", [{"display_name": ""}, {"display_name": "x" * 51}, {"display_name": "Tux", "bio": "x" * 1001}])
def test_invalid_profile_is_rejected(client, sign_in, body):
    headers = sign_in("penguin@example.com")
    assert client.put("/api/me/profile", json=body, headers=headers).status_code == 422


def test_profile_shows_reviews(client, sign_in):
    headers = sign_in("penguin@example.com")
    client.put("/api/me/profile", json={"display_name": "Tux"}, headers=headers)
    client.post("/api/reviews", json={"game_id": 3, "rating": 10, "comment": "Masterpiece"}, headers=headers)

    reviews = client.get("/api/users/1").json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["game"] == {"id": 3, "name": "Hollow Knight"}
    assert reviews[0]["user"] == {"id": 1, "display_name": "Tux"}


@pytest.mark.parametrize("list_name", ["favourites", "backlog"])
def test_add_and_remove_games_from_lists(client, sign_in, list_name):
    headers = sign_in("penguin@example.com")
    assert client.put(f"/api/me/{list_name}/1", headers=headers).status_code == 204
    assert client.put(f"/api/me/{list_name}/2", headers=headers).status_code == 204
    # adding twice is harmless
    assert client.put(f"/api/me/{list_name}/1", headers=headers).status_code == 204

    profile = client.get("/api/users/1").json()
    assert sorted(game["name"] for game in profile[list_name]) == ["Baldur's Gate", "Celeste"]

    assert client.delete(f"/api/me/{list_name}/1", headers=headers).status_code == 204
    assert client.delete(f"/api/me/{list_name}/1", headers=headers).status_code == 204
    assert [game["name"] for game in client.get("/api/users/1").json()[list_name]] == ["Baldur's Gate"]


def test_lists_are_separate(client, sign_in):
    headers = sign_in("penguin@example.com")
    client.put("/api/me/favourites/1", headers=headers)

    profile = client.get("/api/users/1").json()
    assert [game["id"] for game in profile["favourites"]] == [1]
    assert profile["backlog"] == []


def test_list_errors(client, sign_in):
    headers = sign_in("penguin@example.com")
    assert client.put("/api/me/favourites/999", headers=headers).status_code == 404
    assert client.put("/api/me/wishlist/1", headers=headers).status_code == 422
    assert client.put("/api/me/favourites/1").status_code == 401


def test_game_state_for_signed_in_user(client, sign_in):
    headers = sign_in("penguin@example.com")
    assert client.get("/api/me/games/1", headers=headers).json() == {
        "review": None,
        "favourite": False,
        "backlog": False,
    }

    client.put("/api/me/backlog/1", headers=headers)
    client.post("/api/reviews", json={"game_id": 1, "rating": 6, "comment": "Fine"}, headers=headers)
    state = client.get("/api/me/games/1", headers=headers).json()
    assert state["review"]["rating"] == 6
    assert state["favourite"] is False
    assert state["backlog"] is True

    assert client.get("/api/me/games/1").status_code == 401
