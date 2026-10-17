from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
