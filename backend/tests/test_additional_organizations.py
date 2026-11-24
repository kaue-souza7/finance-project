import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.additional_organization_item import (
    AdditionalOrganizationItem,
)

BASE = "/api/v1/additional-organizations"


def _create_income(
    client: TestClient,
    headers: dict,
    title: str = "Décimo terceiro",
    total: str = "5000.00",
    show_observations: bool = False,
) -> dict:
    response = client.post(
        BASE + "/",
        json={
            "title": title,
            "type": "additional_income",
            "total_amount": total,
            "show_observations": show_observations,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_note(
    client: TestClient, headers: dict, title: str = "Anotações"
) -> dict:
    response = client.post(
        BASE + "/",
        json={"title": title, "type": "free_text"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_item(
    client: TestClient,
    headers: dict,
    organization_id: str,
    name: str = "Cartão de crédito",
    amount: str = "800.00",
    observation: str | None = "Pagamento da fatura",
) -> dict:
    response = client.post(
        f"{BASE}/{organization_id}/items",
        json={
            "name": name,
            "amount": amount,
            "observation": observation,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


class TestAdditionalOrganizationCRUD:
    def test_create_free_text(
        self, client: TestClient, owner_headers
    ):
        data = _create_note(client, owner_headers, "Planejamento de dezembro")

        assert data["title"] == "Planejamento de dezembro"
        assert data["type"] == "free_text"
        assert data["total_amount"] is None
        assert data["allocated_amount"] == "0.00"
        assert data["remaining_amount"] is None
        assert data["item_count"] == 0
        assert data["content_preview"] is None

    def test_create_additional_income(
        self, client: TestClient, owner_headers
    ):
        data = _create_income(
            client,
            owner_headers,
            total="5000.00",
            show_observations=True,
        )

        assert data["type"] == "additional_income"
        assert data["total_amount"] == "5000.00"
        assert data["allocated_amount"] == "0.00"
        assert data["remaining_amount"] == "5000.00"
        assert data["show_observations"] is True

    def test_create_income_requires_total(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={"title": "PLR", "type": "additional_income"},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_create_rejects_non_positive_total(
        self, client: TestClient, owner_headers
    ):
        for value in ("0", "-10.00"):
            response = client.post(
                BASE + "/",
                json={
                    "title": "PLR",
                    "type": "additional_income",
                    "total_amount": value,
                },
                headers=owner_headers,
            )
            assert response.status_code == 422

    def test_create_rejects_more_than_two_decimals(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={
                "title": "PLR",
                "type": "additional_income",
                "total_amount": "10.001",
            },
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_free_text_rejects_value(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={
                "title": "Notas",
                "type": "free_text",
                "total_amount": "100.00",
            },
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_free_text_forces_observations_off(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={
                "title": "Notas",
                "type": "free_text",
                "show_observations": True,
            },
            headers=owner_headers,
        )
        assert response.status_code == 201
        assert response.json()["show_observations"] is False

    def test_rejects_empty_title(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={"title": "   ", "type": "free_text"},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_rejects_invalid_type(
        self, client: TestClient, owner_headers
    ):
        response = client.post(
            BASE + "/",
            json={"title": "Teste", "type": "other"},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_list_only_user_organizations(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
    ):
        _create_note(client, owner_headers, "Minha nota")
        _create_income(client, other_headers, title="Receita do outro")

        response = client.get(BASE + "/", headers=owner_headers)
        assert response.status_code == 200
        data = response.json()
        titles = [item["title"] for item in data]
        assert "Minha nota" in titles
        assert "Receita do outro" not in titles

    def test_get_detail_and_not_found(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)

        response = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        )
        assert response.status_code == 200
        assert response.json()["items"] == []

        response = client.get(
            f"{BASE}/{uuid.uuid4()}", headers=owner_headers
        )
        assert response.status_code == 404

    def test_update_free_text_content(
        self, client: TestClient, owner_headers
    ):
        organization = _create_note(client, owner_headers)

        response = client.put(
            f"{BASE}/{organization['id']}",
            json={"title": "Notas atualizadas"},
            headers=owner_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Notas atualizadas"

        response = client.put(
            f"{BASE}/{organization['id']}/content",
            json={
                "content": "Linha 1\nLinha 2",
                "expected_version": data["content_version"],
            },
            headers=owner_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["content_preview"] == "Linha 1 Linha 2"
        assert data["content_version"] == organization["content_version"] + 1

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["content"] == "Linha 1\nLinha 2"

    def test_update_content_conflict(
        self, client: TestClient, owner_headers
    ):
        organization = _create_note(client, owner_headers)

        first = client.put(
            f"{BASE}/{organization['id']}/content",
            json={"content": "Versão 1", "expected_version": 1},
            headers=owner_headers,
        )
        assert first.status_code == 200
        assert first.json()["content_version"] == 2

        conflict = client.put(
            f"{BASE}/{organization['id']}/content",
            json={"content": "Versão concorrente", "expected_version": 1},
            headers=owner_headers,
        )
        assert conflict.status_code == 409

    def test_update_income_total_recalculates(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(
            client, owner_headers, total="5000.00"
        )
        _create_item(
            client, owner_headers, organization["id"], amount="4000.00"
        )

        response = client.put(
            f"{BASE}/{organization['id']}",
            json={"total_amount": "3500.00"},
            headers=owner_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_amount"] == "3500.00"
        assert data["allocated_amount"] == "4000.00"
        assert data["remaining_amount"] == "-500.00"

    def test_update_income_rejects_null_total(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)

        response = client.put(
            f"{BASE}/{organization['id']}",
            json={"total_amount": None},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_delete_organization_cascades_items(
        self,
        client: TestClient,
        db_session: Session,
        owner_headers,
    ):
        organization = _create_income(client, owner_headers)
        _create_item(client, owner_headers, organization["id"])

        response = client.delete(
            f"{BASE}/{organization['id']}", headers=owner_headers
        )
        assert response.status_code == 204

        count = (
            db_session.query(AdditionalOrganizationItem)
            .filter(
                AdditionalOrganizationItem.organization_id
                == uuid.UUID(organization["id"])
            )
            .count()
        )
        assert count == 0

        response = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        )
        assert response.status_code == 404


class TestAdditionalOrganizationItems:
    def test_create_and_list_items(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)
        item = _create_item(
            client,
            owner_headers,
            organization["id"],
            name="Reserva",
            amount="1500.00",
            observation=None,
        )

        assert item["name"] == "Reserva"
        assert item["amount"] == "1500.00"
        assert item["position"] == 1

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["item_count"] == 1
        assert detail["allocated_amount"] == "1500.00"
        assert detail["remaining_amount"] == "3500.00"
        assert detail["items"][0]["name"] == "Reserva"

    def test_update_item(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)
        item = _create_item(client, owner_headers, organization["id"])

        response = client.put(
            f"{BASE}/{organization['id']}/items/{item['id']}",
            json={
                "name": "Cartão Nubank",
                "amount": "900.50",
                "observation": "Fatura de novembro",
            },
            headers=owner_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Cartão Nubank"
        assert data["amount"] == "900.50"
        assert data["observation"] == "Fatura de novembro"

    def test_delete_item(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)
        item = _create_item(client, owner_headers, organization["id"])

        response = client.delete(
            f"{BASE}/{organization['id']}/items/{item['id']}",
            headers=owner_headers,
        )
        assert response.status_code == 204

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["items"] == []
        assert detail["allocated_amount"] == "0.00"

    def test_items_not_allowed_on_free_text(
        self, client: TestClient, owner_headers
    ):
        organization = _create_note(client, owner_headers)

        response = client.post(
            f"{BASE}/{organization['id']}/items",
            json={"name": "Linha", "amount": "10.00"},
            headers=owner_headers,
        )
        assert response.status_code == 422

    def test_item_rejects_non_positive_amount(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)

        for value in ("0.00", "-1.00"):
            response = client.post(
                f"{BASE}/{organization['id']}/items",
                json={"name": "Linha", "amount": value},
                headers=owner_headers,
            )
            assert response.status_code == 422

    def test_item_changes_touch_organization_timestamp(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(client, owner_headers)
        before = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()["updated_at"]

        _create_item(client, owner_headers, organization["id"])

        after = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()["updated_at"]
        assert after > before

    def test_item_must_belong_to_organization(
        self, client: TestClient, owner_headers
    ):
        first = _create_income(
            client, owner_headers, title="Primeira"
        )
        second = _create_income(
            client, owner_headers, title="Segunda"
        )
        item = _create_item(client, owner_headers, first["id"])

        response = client.put(
            f"{BASE}/{second['id']}/items/{item['id']}",
            json={"name": "Alterado"},
            headers=owner_headers,
        )
        assert response.status_code == 404

        response = client.delete(
            f"{BASE}/{second['id']}/items/{item['id']}",
            headers=owner_headers,
        )
        assert response.status_code == 404

    def test_items_can_exceed_total(self, client: TestClient, owner_headers):
        organization = _create_income(
            client, owner_headers, total="100.00"
        )
        _create_item(
            client,
            owner_headers,
            organization["id"],
            amount="100.00",
        )
        _create_item(
            client,
            owner_headers,
            organization["id"],
            name="Viagem",
            amount="50.00",
        )

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["allocated_amount"] == "150.00"
        assert detail["remaining_amount"] == "-50.00"

    def test_observations_are_preserved_when_disabled(
        self, client: TestClient, owner_headers
    ):
        organization = _create_income(
            client, owner_headers, show_observations=True
        )
        item = _create_item(
            client,
            owner_headers,
            organization["id"],
            observation="Guardar para janeiro",
        )

        response = client.put(
            f"{BASE}/{organization['id']}",
            json={"show_observations": False},
            headers=owner_headers,
        )
        assert response.status_code == 200
        assert response.json()["show_observations"] is False

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["items"][0]["observation"] == "Guardar para janeiro"

        response = client.put(
            f"{BASE}/{organization['id']}",
            json={"show_observations": True},
            headers=owner_headers,
        )
        assert response.status_code == 200
        assert response.json()["show_observations"] is True

        assert item["observation"] == "Guardar para janeiro"

    def test_precision_with_cents(self, client: TestClient, owner_headers):
        organization = _create_income(
            client, owner_headers, total="0.10"
        )
        _create_item(
            client,
            owner_headers,
            organization["id"],
            name="Centavo 1",
            amount="0.01",
        )
        _create_item(
            client,
            owner_headers,
            organization["id"],
            name="Centavo 2",
            amount="0.10",
        )

        detail = client.get(
            f"{BASE}/{organization['id']}", headers=owner_headers
        ).json()
        assert detail["allocated_amount"] == "0.11"
        assert detail["remaining_amount"] == "-0.01"


class TestAdditionalOrganizationSecurity:
    def test_requires_authentication(self, client: TestClient):
        assert client.get(BASE + "/").status_code in (401, 403)
        assert (
            client.post(
                BASE + "/",
                json={"title": "X", "type": "free_text"},
            ).status_code
            in (401, 403)
        )

    def test_other_user_cannot_access_organization(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
    ):
        organization = _create_income(client, owner_headers)
        url = f"{BASE}/{organization['id']}"

        assert (
            client.get(url, headers=other_headers).status_code == 404
        )
        assert (
            client.put(
                url,
                json={"title": "Invadido"},
                headers=other_headers,
            ).status_code
            == 404
        )
        assert (
            client.delete(url, headers=other_headers).status_code == 404
        )

    def test_other_user_cannot_access_items(
        self,
        client: TestClient,
        owner_headers,
        other_headers,
    ):
        organization = _create_income(client, owner_headers)
        item = _create_item(client, owner_headers, organization["id"])

        assert (
            client.post(
                f"{BASE}/{organization['id']}/items",
                json={"name": "Invasão", "amount": "10.00"},
                headers=other_headers,
            ).status_code
            == 404
        )
        assert (
            client.put(
                f"{BASE}/{organization['id']}/items/{item['id']}",
                json={"name": "Invasão"},
                headers=other_headers,
            ).status_code
            == 404
        )
        assert (
            client.delete(
                f"{BASE}/{organization['id']}/items/{item['id']}",
                headers=other_headers,
            ).status_code
            == 404
        )
