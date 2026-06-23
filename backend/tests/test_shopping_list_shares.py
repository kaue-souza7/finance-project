import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.shopping_list import ShoppingList


def _create_list(
    db_session: Session, user_id: uuid.UUID, title: str = "Minha Lista"
) -> ShoppingList:
    sl = ShoppingList(
        id=uuid.uuid4(),
        user_id=user_id,
        title=title,
        color="#ef4444",
        icon="shopping-bag",
    )
    db_session.add(sl)
    db_session.commit()
    return sl


def _token(user):
    return create_access_token({"sub": str(user.id)})


class TestInvites:
    """Convites — enviar, aceitar, recusar, cancelar"""

    def test_send_invite(
        self, client: TestClient, db_session: Session, owner_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["shopping_list_id"] == str(sl.id)
        assert data["receiver_user_id"] == str(other_user.id)
        assert data["role"] == "editor"
        assert data["status"] == "pending"

    def test_send_invite_user_not_found(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": "nonexistent@test.com", "role": "viewer"},
            headers=owner_headers,
        )
        assert resp.status_code == 404
        assert "não encontrado" in resp.json()["detail"].lower()

    def test_send_invite_self(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": owner.email, "role": "viewer"},
            headers=owner_headers,
        )
        assert resp.status_code == 422

    def test_send_invite_not_owner(
        self, client: TestClient, db_session: Session, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=other_headers,
        )
        # Sem acesso à lista → 404 (não 403)
        assert resp.status_code == 404

    def test_accept_invite(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]

        accept_resp = client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )
        assert accept_resp.status_code == 200
        assert accept_resp.json()["status"] == "accepted"

        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=other_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "editor"
        assert resp.json()["shared_by"]["id"] == str(owner.id)

    def test_decline_invite(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]

        decline_resp = client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/decline",
            headers=other_headers,
        )
        assert decline_resp.status_code == 200
        assert decline_resp.json()["status"] == "declined"

        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=other_headers,
        )
        assert resp.status_code == 404

    def test_list_received_invites(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user, third_user
    ):
        sl1 = _create_list(db_session, owner.id, "Lista 1")
        sl2 = _create_list(db_session, owner.id, "Lista 2")
        sl3 = _create_list(db_session, third_user.id, "Lista 3")

        client.post(
            f"/api/v1/shopping-lists/{sl1.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        client.post(
            f"/api/v1/shopping-lists/{sl2.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        third_headers = {"Authorization": f"Bearer {_token(third_user)}"}
        client.post(
            f"/api/v1/shopping-lists/{sl3.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=third_headers,
        )

        resp = client.get(
            "/api/v1/shopping-lists/invites/received",
            headers=other_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    def test_cancel_invite(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]

        cancel_resp = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/invites/{invite_id}",
            headers=owner_headers,
        )
        assert cancel_resp.status_code == 204

        resp = client.get(
            "/api/v1/shopping-lists/invites/received",
            headers=other_headers,
        )
        assert len(resp.json()) == 0

    def test_cancel_invite_not_owner_gets_404(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]

        cancel_resp = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/invites/{invite_id}",
            headers=other_headers,
        )
        # Sem acesso → 404
        assert cancel_resp.status_code == 404

    def test_double_invite(
        self, client: TestClient, db_session: Session, owner_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        resp2 = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        assert resp2.status_code == 409


class TestShares:
    """Compartilhamento — owner, editor, viewer"""

    def test_owner_can_manage_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.put(
            f"/api/v1/shopping-lists/{sl.id}",
            json={"title": "Editado"},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Editado"

        resp = client.delete(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=owner_headers,
        )
        assert resp.status_code == 204

    def _accept_invite(self, client, owner_headers, other_headers, sl, owner, other_user):
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

    def test_editor_can_manage_items(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        self._accept_invite(client, owner_headers, other_headers, sl, owner, other_user)

        create_resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Arroz", "quantity": "1 kg"},
            headers=other_headers,
        )
        assert create_resp.status_code == 201
        item_id = create_resp.json()["id"]

        toggle_resp = client.patch(
            f"/api/v1/shopping-lists/{sl.id}/items/{item_id}/toggle",
            json={"checked": True},
            headers=other_headers,
        )
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["checked"] is True

        update_resp = client.put(
            f"/api/v1/shopping-lists/{sl.id}/items/{item_id}",
            json={"name": "Arroz Integral"},
            headers=other_headers,
        )
        assert update_resp.status_code == 200

        delete_resp = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/items/{item_id}",
            headers=other_headers,
        )
        assert delete_resp.status_code == 204

    def test_editor_cannot_edit_list(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        self._accept_invite(client, owner_headers, other_headers, sl, owner, other_user)

        resp = client.put(
            f"/api/v1/shopping-lists/{sl.id}",
            json={"title": "Hackeado"},
            headers=other_headers,
        )
        assert resp.status_code == 403

    def test_viewer_cannot_edit_items(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        create_resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Arroz"},
            headers=other_headers,
        )
        assert create_resp.status_code == 403

    def test_viewer_can_view(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=other_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"

    def test_share_management(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        shares = client.get(
            f"/api/v1/shopping-lists/{sl.id}/shares",
            headers=owner_headers,
        )
        assert shares.status_code == 200
        share_id = shares.json()[0]["id"]

        update_resp = client.put(
            f"/api/v1/shopping-lists/{sl.id}/shares/{share_id}",
            json={"role": "editor"},
            headers=owner_headers,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["role"] == "editor"

        remove_resp = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/shares/{share_id}",
            headers=owner_headers,
        )
        assert remove_resp.status_code == 204

    def test_list_by_user_includes_shared(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id, "Lista Compartilhada")
        self._accept_invite(client, owner_headers, other_headers, sl, owner, other_user)

        resp = client.get(
            "/api/v1/shopping-lists/",
            headers=other_headers,
        )
        assert resp.status_code == 200
        titles = [l["title"] for l in resp.json()]
        assert "Lista Compartilhada" in titles
        roles = [l["role"] for l in resp.json()]
        assert "editor" in roles or "viewer" in roles


class TestSecurity:
    """Segurança — acesso indevido, UUID guessing, cadeia"""

    def test_uuid_guessing_returns_404(
        self, client: TestClient, owner_headers
    ):
        fake_id = uuid.uuid4()
        resp = client.get(
            f"/api/v1/shopping-lists/{fake_id}",
            headers=owner_headers,
        )
        assert resp.status_code == 404

    def test_user_without_access_gets_404(
        self, client: TestClient, db_session: Session, owner_headers, third_headers, owner, third_user
    ):
        sl = _create_list(db_session, owner.id)
        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=third_headers,
        )
        assert resp.status_code == 404

    def test_editor_cannot_share(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, third_headers, owner, other_user, third_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        resp = client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": third_user.email, "role": "viewer"},
            headers=other_headers,
        )
        assert resp.status_code == 403

    def test_editor_cannot_manage_shares(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}/shares",
            headers=other_headers,
        )
        assert resp.status_code == 403

    def test_unauthorized_gets_401(
        self, client: TestClient, db_session: Session, owner
    ):
        sl = _create_list(db_session, owner.id)
        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
        )
        assert resp.status_code in (401, 403)

    def test_user_search(
        self, client: TestClient, db_session: Session, owner_headers, owner, other_user, third_user
    ):
        resp = client.get(
            "/api/v1/users/search?q=other",
            headers=owner_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert any(u["email"] == "other@test.com" for u in data)
        assert not any(u["email"] == "owner@test.com" for u in data)

    def test_user_search_by_email(
        self, client: TestClient, db_session: Session, owner_headers, owner, other_user
    ):
        resp = client.get(
            f"/api/v1/users/search?q={other_user.email}",
            headers=owner_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["email"] == other_user.email

    def test_deleted_list_removes_shares(
        self, client: TestClient, db_session: Session, owner_headers, other_headers, owner, other_user
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"/api/v1/shopping-lists/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=owner_headers,
        )
        invite_id = client.get(
            "/api/v1/shopping-lists/invites/received", headers=other_headers
        ).json()[0]["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        client.delete(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=owner_headers,
        )

        resp = client.get(
            f"/api/v1/shopping-lists/{sl.id}",
            headers=other_headers,
        )
        assert resp.status_code == 404
