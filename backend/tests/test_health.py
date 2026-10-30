from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.api.deps import get_db


class _BrokenSession:
    def execute(self, *args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("database down"))


def test_health_returns_503_when_database_is_down(client: TestClient, app):
    app.dependency_overrides[get_db] = lambda: _BrokenSession()
    try:
        response = client.get("/health")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 503
    assert response.json()["detail"] == "Banco de dados indisponível"


def test_health_checks_database(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_liveness_does_not_require_database(client: TestClient):
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_diagnostics_do_not_expose_pii(client: TestClient, owner):
    response = client.get("/health/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert data["has_users"] is True
    assert data["users_count"] >= 1
    assert "email" not in data
    assert "user_id" not in data
