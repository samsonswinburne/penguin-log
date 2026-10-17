
import os
from uuid import uuid4

import httpx
import pytest


def test_api_reads_and_writes_through_postgres():
    base_url = os.getenv("INTEGRATION_BASE_URL")
    if not base_url:
        pytest.skip("Set INTEGRATION_BASE_URL to run against a PostgreSQL-backed API")

    email = f"integration-{uuid4().hex}@example.test"
    credentials = {"email": email, "password": "test-password-123"}

    with httpx.Client(base_url=base_url, timeout=10) as client:
        health = client.get("/api/db/health")
        assert health.status_code == 200
        assert health.json() == {"status": "ok"}

        registered = client.post("/api/auth/register", json=credentials)
        assert registered.status_code == 201
        assert registered.json()["email"] == email

        login = client.post("/api/auth/login", json=credentials)
        assert login.status_code == 200
        token = login.json()["token"]

        headers = {"Authorization": f"Bearer {token}"}
        me = client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json() == registered.json()

        assert client.post("/api/auth/logout", headers=headers).status_code == 204
        assert client.get("/api/auth/me", headers=headers).status_code == 401
