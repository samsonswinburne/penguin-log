def names(response):
    return [game["name"] for game in response.json()["items"]]


def test_list_genres(client):
    genres = client.get("/api/genres").json()
    assert genres[0] == {"id": 31, "name": "Adventure"}
    assert [genre["name"] for genre in genres] == sorted(genre["name"] for genre in genres)


def test_list_games_sorted_by_name(client):
    response = client.get("/api/games")
    assert response.status_code == 200
    assert response.json()["total"] == 3
    assert names(response) == ["Baldur's Gate", "Celeste", "Hollow Knight"]
    assert response.json()["items"][1] == {
        "id": 1,
        "name": "Celeste",
        "slug": "celeste",
        "release_date": "2018-01-26",
        "genres": [{"id": 32, "name": "Indie"}, {"id": 8, "name": "Platform"}],
    }


def test_filter_games_by_genre(client):
    response = client.get("/api/games", params={"genre": 8})
    assert names(response) == ["Celeste", "Hollow Knight"]
    assert response.json()["total"] == 2

    assert client.get("/api/games", params={"genre": 12}).json()["total"] == 1
    assert client.get("/api/games", params={"genre": 999}).json() == {"items": [], "total": 0}


def test_search_games_by_name(client):
    assert names(client.get("/api/games", params={"q": "  hollow "})) == ["Hollow Knight"]
    assert names(client.get("/api/games", params={"q": "e", "genre": 32})) == ["Celeste"]
    assert names(client.get("/api/games", params={"q": " "})) == ["Baldur's Gate", "Celeste", "Hollow Knight"]


def test_paginate_games(client):
    page = client.get("/api/games", params={"limit": 2, "offset": 2}).json()
    assert page["total"] == 3
    assert [game["name"] for game in page["items"]] == ["Hollow Knight"]

    assert client.get("/api/games", params={"limit": 0}).status_code == 422
    assert client.get("/api/games", params={"limit": 101}).status_code == 422
    assert client.get("/api/games", params={"offset": -1}).status_code == 422


def test_game_detail(client, sign_in):
    detail = client.get("/api/games/2").json()
    assert detail["name"] == "Baldur's Gate"
    assert detail["summary"] == "A fantasy RPG."
    assert detail["igdb_url"] == "https://www.igdb.com/games/baldur-s-gate"
    assert detail["average_rating"] is None
    assert detail["review_count"] == 0
    assert detail["reviews"] == []

    for email, rating in (("first@example.com", 8), ("second@example.com", 5)):
        headers = sign_in(email)
        review = {"game_id": 2, "rating": rating, "comment": f"Rated {rating}"}
        assert client.post("/api/reviews", json=review, headers=headers).status_code == 201

    detail = client.get("/api/games/2").json()
    assert detail["average_rating"] == 6.5
    assert detail["review_count"] == 2
    assert [review["comment"] for review in detail["reviews"]] == ["Rated 5", "Rated 8"]
    assert detail["reviews"][0]["user"] == {"id": 2, "display_name": "Penguin 2"}


def test_unknown_game_is_404(client):
    assert client.get("/api/games/999").status_code == 404
