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


BASE = "/api/v1/shopping-lists"


class TestShoppingListCRUD:
    """CRUD básico de listas de compras"""

    def test_create_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        resp = client.post(
            BASE,
            json={"title": "Mercado Junho", "color": "#22c55e", "icon": "shopping-bag"},
            headers=owner_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Mercado Junho"
        assert data["color"] == "#22c55e"
        assert data["icon"] == "shopping-bag"
        assert data["user_id"] == str(owner.id)
        assert data["role"] == "owner"
        assert data["item_count"] == 0
        assert data["checked_count"] == 0
        assert "id" in data

    def test_list_lists(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        _create_list(db_session, owner.id, "Lista 1")
        _create_list(db_session, owner.id, "Lista 2")

        resp = client.get(BASE, headers=owner_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2
        titles = [d["title"] for d in data]
        assert "Lista 1" in titles
        assert "Lista 2" in titles
        for d in data:
            assert d["role"] == "owner"

    def test_get_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id, "Lista Get")

        resp = client.get(f"{BASE}/{sl.id}", headers=owner_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Lista Get"
        assert data["role"] == "owner"
        assert data["items"] == []

    def test_get_list_not_found(
        self, client: TestClient, db_session: Session, owner_headers
    ):
        resp = client.get(f"{BASE}/{uuid.uuid4()}", headers=owner_headers)
        assert resp.status_code == 404

    def test_update_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id, "Antes")

        resp = client.put(
            f"{BASE}/{sl.id}",
            json={"title": "Depois", "color": "#3b82f6"},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Depois"
        assert data["color"] == "#3b82f6"

    def test_update_list_not_owner(
        self, client: TestClient, db_session: Session, other_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.put(
            f"{BASE}/{sl.id}",
            json={"title": "Hacked"},
            headers=other_headers,
        )
        assert resp.status_code == 404

    def test_delete_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id, "Para Excluir")

        resp = client.delete(f"{BASE}/{sl.id}", headers=owner_headers)
        assert resp.status_code == 204

        resp = client.get(f"{BASE}/{sl.id}", headers=owner_headers)
        assert resp.status_code == 404

    def test_delete_list_not_owner(
        self, client: TestClient, db_session: Session, other_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.delete(f"{BASE}/{sl.id}", headers=other_headers)
        assert resp.status_code == 404

    def test_unauthorized_access(
        self, client: TestClient, db_session: Session, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.get(BASE)
        assert resp.status_code in (401, 403)

        resp = client.post(BASE, json={"title": "X", "color": "#000000", "icon": "x"})
        assert resp.status_code in (401, 403)

        resp = client.get(f"{BASE}/{sl.id}")
        assert resp.status_code in (401, 403)

        resp = client.put(f"{BASE}/{sl.id}", json={"title": "X"})
        assert resp.status_code in (401, 403)

        resp = client.delete(f"{BASE}/{sl.id}")
        assert resp.status_code in (401, 403)


class TestShoppingListItemCRUD:
    """CRUD básico de itens de lista"""

    def test_create_item(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)

        resp = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Arroz", "quantity": "2 kg", "order": 1},
            headers=owner_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Arroz"
        assert data["quantity"] == "2 kg"
        assert data["order"] == 1
        assert data["checked"] is False
        assert data["shopping_list_id"] == str(sl.id)
        assert "id" in data

    def test_list_items(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 1", "order": 0},
            headers=owner_headers,
        )
        client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 2", "order": 1},
            headers=owner_headers,
        )

        resp = client.get(f"{BASE}/{sl.id}", headers=owner_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        names = [i["name"] for i in data["items"]]
        assert "Item 1" in names
        assert "Item 2" in names

    def test_update_item(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        item = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Feijão", "quantity": "1 kg", "order": 0},
            headers=owner_headers,
        ).json()

        resp = client.put(
            f"{BASE}/{sl.id}/items/{item['id']}",
            json={"name": "Feijão Preto", "quantity": "2 kg"},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Feijão Preto"
        assert data["quantity"] == "2 kg"

    def test_toggle_item(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        item = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Leite", "order": 0},
            headers=owner_headers,
        ).json()
        assert item["checked"] is False

        resp = client.patch(
            f"{BASE}/{sl.id}/items/{item['id']}/toggle",
            json={"checked": True},
            headers=owner_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["checked"] is True

    def test_complete_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        i1 = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 1", "order": 0},
            headers=owner_headers,
        ).json()
        i2 = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 2", "order": 1},
            headers=owner_headers,
        ).json()

        client.patch(
            f"{BASE}/{sl.id}/items/{i1['id']}/toggle",
            json={"checked": True},
            headers=owner_headers,
        )
        resp = client.patch(
            f"{BASE}/{sl.id}/items/{i2['id']}/toggle",
            json={"checked": True},
            headers=owner_headers,
        )
        assert resp.status_code == 200

        detail = client.get(f"{BASE}/{sl.id}", headers=owner_headers).json()
        assert detail["completed_at"] is not None

    def test_uncomplete_list(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        i1 = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 1", "order": 0},
            headers=owner_headers,
        ).json()
        i2 = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item 2", "order": 1},
            headers=owner_headers,
        ).json()

        client.patch(
            f"{BASE}/{sl.id}/items/{i1['id']}/toggle",
            json={"checked": True},
            headers=owner_headers,
        )
        client.patch(
            f"{BASE}/{sl.id}/items/{i2['id']}/toggle",
            json={"checked": True},
            headers=owner_headers,
        )

        client.patch(
            f"{BASE}/{sl.id}/items/{i2['id']}/toggle",
            json={"checked": False},
            headers=owner_headers,
        )
        detail = client.get(f"{BASE}/{sl.id}", headers=owner_headers).json()
        assert detail["completed_at"] is None

    def test_delete_item(
        self, client: TestClient, db_session: Session, owner_headers, owner
    ):
        sl = _create_list(db_session, owner.id)
        item = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item para excluir", "order": 0},
            headers=owner_headers,
        ).json()

        resp = client.delete(
            f"{BASE}/{sl.id}/items/{item['id']}", headers=owner_headers
        )
        assert resp.status_code == 204

        detail = client.get(f"{BASE}/{sl.id}", headers=owner_headers).json()
        assert len(detail["items"]) == 0

    def test_viewer_cannot_create_item(
        self,
        client: TestClient,
        db_session: Session,
        owner,
        other_user,
        other_headers,
    ):
        sl = _create_list(db_session, owner.id)
        share_resp = client.post(
            f"{BASE}/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=self._owner_headers(db_session, owner),
        )
        invite_id = share_resp.json()["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        resp = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item", "order": 0},
            headers=other_headers,
        )
        assert resp.status_code == 403

    def test_viewer_cannot_toggle_item(
        self,
        client: TestClient,
        db_session: Session,
        owner,
        other_user,
        other_headers,
    ):
        sl = _create_list(db_session, owner.id)
        share_resp = client.post(
            f"{BASE}/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "viewer"},
            headers=self._owner_headers(db_session, owner),
        )
        invite_id = share_resp.json()["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )
        item = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item", "order": 0},
            headers=self._owner_headers(db_session, owner),
        ).json()

        resp = client.patch(
            f"{BASE}/{sl.id}/items/{item['id']}/toggle",
            json={"checked": True},
            headers=other_headers,
        )
        assert resp.status_code == 403

    def test_editor_can_create_and_toggle(
        self,
        client: TestClient,
        db_session: Session,
        owner,
        other_user,
        other_headers,
    ):
        sl = _create_list(db_session, owner.id)
        share_resp = client.post(
            f"{BASE}/{sl.id}/invite",
            json={"user_email": other_user.email, "role": "editor"},
            headers=self._owner_headers(db_session, owner),
        )
        invite_id = share_resp.json()["id"]
        client.post(
            f"/api/v1/shopping-lists/invites/{invite_id}/accept",
            headers=other_headers,
        )

        resp = client.post(
            f"{BASE}/{sl.id}/items",
            json={"name": "Item do Editor", "order": 0},
            headers=other_headers,
        )
        assert resp.status_code == 201
        item_id = resp.json()["id"]

        resp = client.patch(
            f"{BASE}/{sl.id}/items/{item_id}/toggle",
            json={"checked": True},
            headers=other_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["checked"] is True

    def _owner_headers(self, db_session, owner):
        token = create_access_token({"sub": str(owner.id)})
        return {"Authorization": f"Bearer {token}"}
