from fastapi.testclient import TestClient

from app.core.rate_limit import limiter


def test_login_is_rate_limited(client: TestClient):
    limiter.reset()
    limiter.enabled = True
    try:
        statuses = [
            client.post(
                "/api/v1/auth/login",
                json={"email": "rate@test.com", "password": "SenhaErrada1"},
            ).status_code
            for _ in range(11)
        ]
        assert 429 in statuses
    finally:
        limiter.enabled = False
        limiter.reset()
