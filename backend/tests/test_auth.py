from fastapi.testclient import TestClient

from app.main import app


def test_unauthenticated():
    client = TestClient(app)
    res = client.get("/users/me")
    assert res.status_code == 401
    assert res.json()["detail"] == "Not authenticated"
