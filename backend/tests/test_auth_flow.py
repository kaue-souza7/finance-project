import logging
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from fastapi.testclient import TestClient


REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
REFRESH = "/api/v1/auth/refresh"
LOGOUT = "/api/v1/auth/logout"
FORGOT = "/api/v1/auth/forgot-password"
RESET = "/api/v1/auth/reset-password"


def _register(client: TestClient, email: str = "new@test.com"):
    return client.post(
        REGISTER,
        json={"name": "New User", "email": email, "password": "SenhaForte1"},
    )


def test_register_seeds_default_categories_and_returns_tokens(client: TestClient):
    resp = _register(client)
    assert resp.status_code == 201

    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["expires_in"] == 30 * 60

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    categories = client.get("/api/v1/categories/", headers=headers)
    assert categories.status_code == 200
    assert len(categories.json()) == 8
    assert {c["name"] for c in categories.json()} >= {"Moradia", "Alimentação"}


def test_seed_defaults_is_idempotent(client: TestClient):
    tokens = _register(client, "seed@test.com").json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    first = client.post("/api/v1/categories/defaults", headers=headers)
    assert first.status_code == 200
    assert len(first.json()) == 8

    second = client.post("/api/v1/categories/defaults", headers=headers)
    assert second.status_code == 200
    assert len(second.json()) == 8


def test_duplicate_email_is_case_insensitive(client: TestClient):
    assert _register(client, "Case@Test.com").status_code == 201
    resp = _register(client, "case@test.com")
    assert resp.status_code == 409


def test_weak_password_is_rejected(client: TestClient):
    resp = client.post(
        REGISTER,
        json={"name": "Weak", "email": "weak@test.com", "password": "123456"},
    )
    assert resp.status_code == 422


def test_refresh_rotates_and_rejects_reuse(client: TestClient):
    tokens = _register(client, "refresh@test.com").json()
    old_refresh = tokens["refresh_token"]

    resp = client.post(REFRESH, json={"refresh_token": old_refresh})
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["refresh_token"] != old_refresh

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"},
    )
    assert me.status_code == 200

    reuse = client.post(REFRESH, json={"refresh_token": old_refresh})
    assert reuse.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient):
    tokens = _register(client, "logout@test.com").json()
    refresh_token = tokens["refresh_token"]

    assert client.post(LOGOUT, json={"refresh_token": refresh_token}).status_code == 204
    assert client.post(REFRESH, json={"refresh_token": refresh_token}).status_code == 401


def test_password_reset_flow(client: TestClient):
    tokens = _register(client, "reset@test.com").json()
    old_refresh = tokens["refresh_token"]

    with patch("app.api.v1.auth.send_password_reset_email") as send_mail:
        resp = client.post(FORGOT, json={"email": "reset@test.com"})
        assert resp.status_code == 202
        send_mail.assert_called_once()
        _, reset_link = send_mail.call_args.args

    token = parse_qs(urlparse(reset_link).query)["token"][0]
    resp = client.post(
        RESET,
        json={
            "token": token,
            "new_password": "NovaSenha2",
            "confirm_new_password": "NovaSenha2",
        },
    )
    assert resp.status_code == 204

    assert client.post(
        LOGIN, json={"email": "reset@test.com", "password": "SenhaForte1"}
    ).status_code == 401
    assert client.post(
        LOGIN, json={"email": "reset@test.com", "password": "NovaSenha2"}
    ).status_code == 200

    # O reset revoga as sessões antigas.
    assert client.post(REFRESH, json={"refresh_token": old_refresh}).status_code == 401


def test_login_unknown_email_logs_reason_without_pii(client: TestClient, caplog):
    with caplog.at_level(logging.INFO):
        response = client.post(
            LOGIN,
            json={"email": "nobody@test.com", "password": "WrongPass1"},
        )
    assert response.status_code == 401
    assert "usuário não encontrado" in caplog.text
    assert "nobody@test.com" not in caplog.text


def test_login_wrong_password_logs_reason_without_pii(
    client: TestClient, owner, caplog
):
    with caplog.at_level(logging.INFO):
        response = client.post(
            LOGIN,
            json={"email": owner.email, "password": "WrongPass1"},
        )
    assert response.status_code == 401
    assert "senha inválida" in caplog.text
    assert owner.email not in caplog.text


def test_forgot_password_does_not_reveal_unknown_email(client: TestClient):
    with patch("app.api.v1.auth.send_password_reset_email") as send_mail:
        resp = client.post(FORGOT, json={"email": "unknown@test.com"})
        assert resp.status_code == 202
        send_mail.assert_not_called()
