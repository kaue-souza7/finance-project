import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.additional_organization_invite import (
    AdditionalOrganizationInvite,
)
from app.models.user import User

BASE = "/api/v1/additional-organizations"


def _create_income(
    client: TestClient,
    headers: dict,
    title: str = "Décimo terceiro",
    total: str = "5000.00",
) -> dict:
    response = client.post(
        BASE + "/",
        json={
            "title": title,
            "type": "additional_income",
            "total_amount": total,
            "show_observations": False,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_note(
    client: TestClient, headers: dict, title: str = "Notas"
) -> dict:
    response = client.post(
        BASE + "/",
        json={"title": title, "type": "free_text"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _send_invite(
    client: TestClient,
    headers: dict,
    organization_id: str,
    email: str,
) -> dict:
    response = client.post(
        f"{BASE}/{organization_id}/invites",
        json={"email": email},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _received_invite(
    client: TestClient, headers: dict, email: str | None = None
) -> dict:
    response = client.get(
        f"{BASE}/invites/received", headers=headers
    )
    assert response.status_code == 200, response.text
    invitations = response.json()
    if email is not None:
        invitations = [
            invite for invite in invitations if invite["invited_email"] == email
        ]
    assert invitations
    return invitations[0]


def _accept(
    client: TestClient, headers: dict, invite_id: str
) -> dict:
    response = client.post(
        f"{BASE}/invites/{invite_id}/accept", headers=headers
    )
    assert response.status_code == 200, response.text
    return response.json()


def _new_user(db_session: Session, email: str) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        name=email.split("@")[0],
        hashed_password=hash_password("Test1234"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    return user


class TestAdditionalOrganizationInvites:
    def test_send_invite_to_registered_user(
        self, client: TestClient, owner_headers, other_user
    ):
        organization = _create_income(client, owner_headers)

        data = _send_invite(
            client,
            owner_headers,
            organization["id"],
            other_user.email,
        )

        assert data["organization_id"] == organization["id"]
        assert data["invited_email"] == other_user.email
        assert data["receiver_user_id"] == str(other_user.id)
        assert data["status"] == "pending"
        assert "token" not in data
        assert "token_hash" not in data

    def test_send_invite_to_unregistered_email(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)
        email = "future-user@test.com"

        data = _send_invite(
            client, owner_headers, organization["id"], email
        )
        assert data["invited_email"] == email
        assert data["receiver_user_id"] is None
        assert data["status"] == "pending"

    def test_send_invite_self(
        self, client: TestClient, owner_headers, owner
    ):
        organization = _create_income(client, owner_headers)

        response = client.post(
            f"{BASE}/{organization['id']}/invites",
            json={"email": owner.email.upper()},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_send_invite_duplicate(
        self, client: TestClient, owner_headers, other_user
    ):
        organization = _create_income(client, owner_headers)
        _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        response = client.post(
            f"{BASE}/{organization['id']}/invites",
            json={"email": other_user.email},
            headers=owner_headers,
        )
        assert response.status_code == 409

    def test_participant_cannot_invite(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
        third_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        response = client.post(
            f"{BASE}/{organization['id']}/invites",
            json={"email": third_user.email},
            headers=other_headers,
        )
        assert response.status_code == 403

    def test_received_invite_and_accept(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        received = _received_invite(
            client, other_headers, other_user.email
        )
        assert received["id"] == invite["id"]

        accepted = _accept(client, other_headers, invite["id"])
        assert accepted["status"] == "accepted"

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=other_headers
        )
        assert detail.status_code == 200
        data = detail.json()
        assert data["role"] == "participant"
        assert data["owner"]["id"] == organization["user_id"]
        assert data["items"] == []

        shared = client.get(
            f"{BASE}/shared", headers=other_headers
        )
        assert shared.status_code == 200
        shared_data = shared.json()
        assert len(shared_data) == 1
        assert shared_data[0]["id"] == organization["id"]
        assert shared_data[0]["role"] == "participant"

    def test_pending_invite_does_not_grant_access(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        response = client.get(
            f"{BASE}/{organization['id']}", headers=other_headers
        )
        assert response.status_code == 404

    def test_wrong_user_cannot_accept(
        self,
        client: TestClient,
        owner_headers,
        third_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        response = client.post(
            f"{BASE}/invites/{invite['id']}/accept",
            headers=third_headers,
        )
        assert response.status_code == 404

    def test_send_invite_invalid_email(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)

        response = client.post(
            f"{BASE}/{organization['id']}/invites",
            json={"email": "not-an-email"},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_accept_invite_only_once(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        second = client.post(
            f"{BASE}/invites/{invite['id']}/accept",
            headers=other_headers,
        )
        assert second.status_code == 422

    def test_participant_cannot_remove_participant(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        third_user,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite_other = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite_other["id"])

        invite_third = _send_invite(
            client, owner_headers, organization["id"], third_user.email
        )
        third_headers = {
            "Authorization": f"Bearer {create_access_token({'sub': str(third_user.id)})}"
        }
        _accept(client, third_headers, invite_third["id"])

        participants = client.get(
            f"{BASE}/{organization['id']}/participants",
            headers=owner_headers,
        ).json()
        third = next(
            participant
            for participant in participants
            if participant["user_id"] == str(third_user.id)
        )

        response = client.delete(
            f"{BASE}/{organization['id']}/participants/{third['membership_id']}",
            headers=other_headers,
        )
        assert response.status_code == 403

    def test_decline_invite(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        response = client.post(
            f"{BASE}/invites/{invite['id']}/decline",
            headers=other_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "declined"

        received = client.get(
            f"{BASE}/invites/received", headers=other_headers
        ).json()
        assert received == []

        invites = client.get(
            f"{BASE}/{organization['id']}/invites",
            headers=owner_headers,
        ).json()
        assert invites[0]["status"] == "declined"

    def test_cancel_invite(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        response = client.delete(
            f"{BASE}/{organization['id']}/invites/{invite['id']}",
            headers=owner_headers,
        )
        assert response.status_code == 204

        accept = client.post(
            f"{BASE}/invites/{invite['id']}/accept",
            headers=other_headers,
        )
        assert accept.status_code == 422

    def test_expired_invite(
        self,
        client: TestClient,
        db_session: Session,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )

        db_invite = db_session.get(
            AdditionalOrganizationInvite, uuid.UUID(invite["id"])
        )
        assert db_invite is not None
        db_invite.expires_at = datetime.now(timezone.utc) - timedelta(
            minutes=1
        )
        db_session.commit()

        invites = client.get(
            f"{BASE}/{organization['id']}/invites",
            headers=owner_headers,
        ).json()
        assert invites[0]["status"] == "expired"

        accept = client.post(
            f"{BASE}/invites/{invite['id']}/accept",
            headers=other_headers,
        )
        assert accept.status_code == 410

        resend = client.post(
            f"{BASE}/{organization['id']}/invites/{invite['id']}/resend",
            headers=owner_headers,
        )
        assert resend.status_code == 422

    def test_resend_rotates_token(
        self, client: TestClient, owner_headers, other_user, monkeypatch
    ):
        organization = _create_income(client, owner_headers)
        monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
        sent_tasks: list[tuple] = []

        def fake_task(*args):
            sent_tasks.append(args)

        monkeypatch.setattr(
            "app.api.v1.additional_organization_sharing."
            "send_additional_organization_invite_email_task",
            fake_task,
        )

        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        assert sent_tasks
        first_link = sent_tasks[-1][2]
        first_token = parse_qs(urlparse(first_link).query)["token"][0]

        resend = client.post(
            f"{BASE}/{organization['id']}/invites/{invite['id']}/resend",
            headers=owner_headers,
        )
        assert resend.status_code == 200, resend.text
        second_link = sent_tasks[-1][2]
        second_token = parse_qs(urlparse(second_link).query)["token"][0]
        assert first_token != second_token

        old_preview = client.post(
            f"{BASE}/invites/resolve",
            json={"token": first_token},
            headers={
                "Authorization": f"Bearer {create_access_token({'sub': str(other_user.id)})}"
            },
        )
        assert old_preview.status_code == 404

        new_preview = client.post(
            f"{BASE}/invites/resolve",
            json={"token": second_token},
            headers={
                "Authorization": f"Bearer {create_access_token({'sub': str(other_user.id)})}"
            },
        )
        assert new_preview.status_code == 200
        assert new_preview.json()["title"] == organization["title"]

    def test_invite_claimed_after_registration(
        self,
        client: TestClient,
        db_session: Session,
        owner_headers,
    ):
        email = "claimed@test.com"
        organization = _create_income(client, owner_headers)
        _send_invite(client, owner_headers, organization["id"], email)

        user = _new_user(db_session, email)
        headers = {
            "Authorization": f"Bearer {create_access_token({'sub': str(user.id)})}"
        }

        received = _received_invite(client, headers, email)
        assert received["receiver_user_id"] == str(user.id)
        _accept(client, headers, received["id"])

        shared = client.get(f"{BASE}/shared", headers=headers).json()
        assert shared[0]["id"] == organization["id"]


class TestAdditionalOrganizationCollaboration:
    def test_participant_can_edit_content_but_not_metadata(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_note(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=other_headers
        ).json()
        assert detail["role"] == "participant"

        content = client.put(
            f"{BASE}/{organization['id']}/content",
            json={
                "content": "Editado pelo participante",
                "expected_version": detail["content_version"],
            },
            headers=other_headers,
        )
        assert content.status_code == 200
        assert content.json()["content_version"] == 2

        metadata = client.put(
            f"{BASE}/{organization['id']}",
            json={"title": "Tentativa de título"},
            headers=other_headers,
        )
        assert metadata.status_code == 403

        delete = client.delete(
            f"{BASE}/{organization['id']}", headers=other_headers
        )
        assert delete.status_code == 403

    def test_content_conflict_between_users(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_note(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        participant = client.put(
            f"{BASE}/{organization['id']}/content",
            json={"content": "Versão do participante", "expected_version": 1},
            headers=other_headers,
        )
        assert participant.status_code == 200

        owner_conflict = client.put(
            f"{BASE}/{organization['id']}/content",
            json={"content": "Versão do proprietário", "expected_version": 1},
            headers=owner_headers,
        )
        assert owner_conflict.status_code == 409

        owner_current = client.put(
            f"{BASE}/{organization['id']}/content",
            json={"content": "Versão do proprietário", "expected_version": 2},
            headers=owner_headers,
        )
        assert owner_current.status_code == 200

    def test_participant_can_manage_items_and_owner_sees_updates(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        create = client.post(
            f"{BASE}/{organization['id']}/items",
            json={
                "name": "Reserva",
                "amount": "1500.00",
                "observation": "Guardar",
            },
            headers=other_headers,
        )
        assert create.status_code == 201, create.text
        item = create.json()

        owner_detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert owner_detail["allocated_amount"] == "1500.00"
        assert owner_detail["remaining_amount"] == "3500.00"
        assert owner_detail["items"][0]["name"] == "Reserva"

        update = client.put(
            f"{BASE}/{organization['id']}/items/{item['id']}",
            json={
                "name": "Reserva atualizada",
                "amount": "1600.00",
                "expected_updated_at": item["updated_at"],
            },
            headers=other_headers,
        )
        assert update.status_code == 200
        updated = update.json()

        stale = client.put(
            f"{BASE}/{organization['id']}/items/{item['id']}",
            json={
                "name": "Sobrescrita antiga",
                "amount": "1700.00",
                "expected_updated_at": item["updated_at"],
            },
            headers=owner_headers,
        )
        assert stale.status_code == 409

        assert updated["name"] == "Reserva atualizada"
        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["allocated_amount"] == "1600.00"

    def test_remove_participant_revokes_access(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_income(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        participants = client.get(
            f"{BASE}/{organization['id']}/participants",
            headers=owner_headers,
        ).json()
        member = next(
            participant
            for participant in participants
            if participant["role"] == "participant"
        )

        response = client.delete(
            f"{BASE}/{organization['id']}/participants/{member['membership_id']}",
            headers=owner_headers,
        )
        assert response.status_code == 204

        assert (
            client.get(
                f"{BASE}/{organization['id']}", headers=other_headers
            ).status_code
            == 404
        )
        assert (
            client.get(
                f"{BASE}/{organization['id']}", headers=owner_headers
            ).status_code
            == 200
        )

        reinvite = client.post(
            f"{BASE}/{organization['id']}/invites",
            json={"email": other_user.email},
            headers=owner_headers,
        )
        assert reinvite.status_code == 201

    def test_participant_can_list_participants(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
        other_user,
    ):
        organization = _create_note(client, owner_headers)
        invite = _send_invite(
            client, owner_headers, organization["id"], other_user.email
        )
        _accept(client, other_headers, invite["id"])

        response = client.get(
            f"{BASE}/{organization['id']}/participants",
            headers=other_headers,
        )
        assert response.status_code == 200
        participants = response.json()
        roles = {participant["role"] for participant in participants}
        assert roles == {"owner", "participant"}
