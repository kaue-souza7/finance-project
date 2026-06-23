import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.shopping_list import ShoppingList
from app.models.shopping_list_item import ShoppingListItem
from app.repositories.shopping_list_repository import ShoppingListRepository
from app.repositories.shopping_list_item_repository import (
    ShoppingListItemRepository,
)
from app.repositories.shopping_list_invite_repository import (
    ShoppingListInviteRepository,
)
from app.repositories.shopping_list_share_repository import (
    ShoppingListShareRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.shopping_list import (
    ShoppingListCreate,
    ShoppingListDetailResponse,
    ShoppingListInviteResponse,
    ShoppingListItemResponse,
    ShoppingListResponse,
    ShoppingListShareResponse,
    ShoppingListUpdate,
    ShoppingListItemCreate,
    ShoppingListItemToggle,
    ShoppingListItemUpdate,
    UserBrief,
    UserSearchResponse,
)


class ShoppingListService:
    def __init__(self, db: Session):
        self.db = db
        self.list_repo = ShoppingListRepository()
        self.item_repo = ShoppingListItemRepository()
        self.invite_repo = ShoppingListInviteRepository()
        self.share_repo = ShoppingListShareRepository()
        self.user_repo = UserRepository()

    def _get_list_for_user(
        self, list_id: str, user_id: str
    ) -> tuple[ShoppingList, str]:
        lid = uuid.UUID(list_id)
        uid = uuid.UUID(user_id)
        shopping_list = self.list_repo.get_by_id(self.db, lid)
        if not shopping_list:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        if shopping_list.user_id == uid:
            return shopping_list, "owner"
        share = self.share_repo.get_by_list_and_user(
            self.db, lid, uid
        )
        if share:
            return shopping_list, share.role
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    def _assert_owner(self, list_id: str, user_id: str) -> ShoppingList:
        shopping_list, role = self._get_list_for_user(list_id, user_id)
        if role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o proprietário pode realizar esta ação",
            )
        return shopping_list

    def _assert_edit(self, list_id: str, user_id: str) -> ShoppingList:
        shopping_list, role = self._get_list_for_user(list_id, user_id)
        if role == "viewer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode visualizar esta lista",
            )
        return shopping_list

    def _recalculate_completed_at(
        self, shopping_list_id: uuid.UUID
    ) -> None:
        total = self.item_repo.count_total(self.db, shopping_list_id)
        checked = self.item_repo.count_checked(self.db, shopping_list_id)
        shopping_list = self.list_repo.get_by_id(self.db, shopping_list_id)
        if not shopping_list:
            return

        if total > 0 and checked == total:
            shopping_list.completed_at = datetime.now(timezone.utc)
        else:
            shopping_list.completed_at = None
        self.db.flush()

    def _to_list_response(
        self, shopping_list: ShoppingList, current_user_id: uuid.UUID
    ) -> ShoppingListResponse:
        total = self.item_repo.count_total(self.db, shopping_list.id)
        checked = self.item_repo.count_checked(self.db, shopping_list.id)
        response = ShoppingListResponse.model_validate(shopping_list)
        response.item_count = total
        response.checked_count = checked

        if shopping_list.user_id == current_user_id:
            response.role = "owner"
        else:
            share = self.share_repo.get_by_list_and_user(
                self.db, shopping_list.id, current_user_id
            )
            if share:
                response.role = share.role
                creator = self.user_repo.get_by_id(
                    self.db, share.created_by
                )
                if creator:
                    response.shared_by = UserBrief(
                        id=creator.id,
                        name=creator.name,
                        email=creator.email,
                    )

        return response

    def _invite_to_response(
        self, invite
    ) -> ShoppingListInviteResponse:
        resp = ShoppingListInviteResponse.model_validate(invite)
        if invite.shopping_list:
            resp.shopping_list_title = invite.shopping_list.title
        if invite.sender:
            resp.sender_name = invite.sender.name
            resp.sender_email = invite.sender.email
        if invite.receiver:
            resp.receiver_name = invite.receiver.name
            resp.receiver_email = invite.receiver.email
        return resp

    def _share_to_response(
        self, share
    ) -> ShoppingListShareResponse:
        resp = ShoppingListShareResponse.model_validate(share)
        if share.user:
            resp.user_name = share.user.name
            resp.user_email = share.user.email
        return resp

    def search_users(
        self, q: str, current_user_id: str
    ) -> list[UserSearchResponse]:
        uid = uuid.UUID(current_user_id)
        users = self.user_repo.search(self.db, q, uid)
        return [UserSearchResponse.model_validate(u) for u in users]

    def list_by_user(
        self, user_id: str
    ) -> list[ShoppingListResponse]:
        uid = uuid.UUID(user_id)
        owned = self.list_repo.list_by_user(self.db, uid)
        shared = self.share_repo.list_shared_lists_for_user(self.db, uid)
        seen = set()
        unique = []
        for sl in owned + shared:
            if sl.id not in seen:
                seen.add(sl.id)
                unique.append(sl)
        return [
            self._to_list_response(sl, uid) for sl in unique
        ]

    def create(
        self, user_id: str, data: ShoppingListCreate
    ) -> ShoppingListResponse:
        uid = uuid.UUID(user_id)
        shopping_list = self.list_repo.create(self.db, uid, data)
        self.db.commit()
        return self._to_list_response(shopping_list, uid)

    def get_by_id(
        self, list_id: str, user_id: str
    ) -> ShoppingListDetailResponse:
        shopping_list, role = self._get_list_for_user(list_id, user_id)
        uid = uuid.UUID(user_id)
        items = self.item_repo.list_by_list(self.db, shopping_list.id)
        total = self.item_repo.count_total(self.db, shopping_list.id)
        checked = self.item_repo.count_checked(self.db, shopping_list.id)
        response = ShoppingListDetailResponse.model_validate(
            shopping_list
        )
        response.item_count = total
        response.checked_count = checked
        response.items = [
            ShoppingListItemResponse.model_validate(i) for i in items
        ]
        response.role = role
        if role != "owner":
            share = self.share_repo.get_by_list_and_user(
                self.db, shopping_list.id, uid
            )
            if share:
                creator = self.user_repo.get_by_id(
                    self.db, share.created_by
                )
                if creator:
                    response.shared_by = UserBrief(
                        id=creator.id,
                        name=creator.name,
                        email=creator.email,
                    )
        return response

    def update(
        self, list_id: str, user_id: str, data: ShoppingListUpdate
    ) -> ShoppingListResponse:
        shopping_list = self._assert_owner(list_id, user_id)
        uid = uuid.UUID(user_id)
        shopping_list = self.list_repo.update(
            self.db, shopping_list, data
        )
        self.db.commit()
        return self._to_list_response(shopping_list, uid)

    def delete(self, list_id: str, user_id: str) -> None:
        shopping_list = self._assert_owner(list_id, user_id)
        self.list_repo.delete(self.db, shopping_list)
        self.db.commit()

    def create_item(
        self, list_id: str, user_id: str, data: ShoppingListItemCreate
    ) -> ShoppingListItemResponse:
        shopping_list = self._assert_edit(list_id, user_id)
        try:
            item = self.item_repo.create(
                self.db, shopping_list.id, data
            )
            self._recalculate_completed_at(shopping_list.id)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return ShoppingListItemResponse.model_validate(item)

    def update_item(
        self,
        list_id: str,
        item_id: str,
        user_id: str,
        data: ShoppingListItemUpdate,
    ) -> ShoppingListItemResponse:
        shopping_list = self._assert_edit(list_id, user_id)
        item = self.item_repo.get_by_id(self.db, uuid.UUID(item_id))
        if not item or item.shopping_list_id != shopping_list.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        try:
            item = self.item_repo.update(self.db, item, data)
            self._recalculate_completed_at(shopping_list.id)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return ShoppingListItemResponse.model_validate(item)

    def delete_item(
        self, list_id: str, item_id: str, user_id: str
    ) -> None:
        shopping_list = self._assert_edit(list_id, user_id)
        item = self.item_repo.get_by_id(self.db, uuid.UUID(item_id))
        if not item or item.shopping_list_id != shopping_list.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        try:
            self.item_repo.delete(self.db, item)
            self._recalculate_completed_at(shopping_list.id)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def toggle_item(
        self,
        list_id: str,
        item_id: str,
        user_id: str,
        data: ShoppingListItemToggle,
    ) -> ShoppingListItemResponse:
        shopping_list = self._assert_edit(list_id, user_id)
        item = self.item_repo.get_by_id(self.db, uuid.UUID(item_id))
        if not item or item.shopping_list_id != shopping_list.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        try:
            item.checked = data.checked
            self.db.flush()
            self._recalculate_completed_at(shopping_list.id)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return ShoppingListItemResponse.model_validate(item)

    def send_invite(
        self, list_id: str, owner_id: str, email: str, role: str
    ) -> ShoppingListInviteResponse:
        lid = uuid.UUID(list_id)
        oid = uuid.UUID(owner_id)

        self._assert_owner(list_id, owner_id)
        shopping_list = self.list_repo.get_by_id(self.db, lid)

        receiver = self.user_repo.get_by_email(self.db, email)
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        if receiver.id == oid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você não pode convidar a si mesmo",
            )

        existing_share = self.share_repo.get_by_list_and_user(
            self.db, lid, receiver.id
        )
        if existing_share:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Usuário já tem acesso a esta lista",
            )

        pending = self.invite_repo.get_pending_by_list_and_user(
            self.db, lid, receiver.id
        )
        if pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Convite já enviado para este usuário",
            )

        invite = self.invite_repo.create(
            self.db, lid, oid, receiver.id, role
        )
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def accept_invite(
        self, invite_id: str, user_id: str
    ) -> ShoppingListInviteResponse:
        invite = self.invite_repo.get_by_id(
            self.db, uuid.UUID(invite_id)
        )
        if not invite or str(invite.receiver_user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        existing_share = self.share_repo.get_by_list_and_user(
            self.db, invite.shopping_list_id, uuid.UUID(user_id)
        )
        if existing_share:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
            return self._invite_to_response(invite)

        try:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.share_repo.create(
                self.db,
                invite.shopping_list_id,
                uuid.UUID(user_id),
                invite.role,
                invite.sender_id,
            )
            self.db.commit()
            self.db.refresh(invite)
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao aceitar convite",
            )

        return self._invite_to_response(invite)

    def decline_invite(
        self, invite_id: str, user_id: str
    ) -> ShoppingListInviteResponse:
        invite = self.invite_repo.get_by_id(
            self.db, uuid.UUID(invite_id)
        )
        if not invite or str(invite.receiver_user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        self.invite_repo.update_status(self.db, invite, "declined")
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def cancel_invite(
        self, list_id: str, invite_id: str, user_id: str
    ) -> None:
        self._assert_owner(list_id, user_id)
        invite = self.invite_repo.get_by_id(
            self.db, uuid.UUID(invite_id)
        )
        if not invite or str(invite.shopping_list_id) != list_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )
        self.invite_repo.delete(self.db, invite)
        self.db.commit()

    def get_received_invites(
        self, user_id: str
    ) -> list[ShoppingListInviteResponse]:
        uid = uuid.UUID(user_id)
        invites = self.invite_repo.list_received_by_user(self.db, uid)
        return [self._invite_to_response(i) for i in invites]

    def get_pending_invites_by_list(
        self, list_id: str, user_id: str
    ) -> list[ShoppingListInviteResponse]:
        self._assert_owner(list_id, user_id)
        lid = uuid.UUID(list_id)
        invites = self.invite_repo.list_pending_by_list(self.db, lid)
        return [self._invite_to_response(i) for i in invites]

    def list_shares(
        self, list_id: str, user_id: str
    ) -> list[ShoppingListShareResponse]:
        self._assert_owner(list_id, user_id)
        lid = uuid.UUID(list_id)
        shares = self.share_repo.list_by_list(self.db, lid)
        return [self._share_to_response(s) for s in shares]

    def update_share(
        self, list_id: str, share_id: str, user_id: str, role: str
    ) -> ShoppingListShareResponse:
        self._assert_owner(list_id, user_id)
        lid = uuid.UUID(list_id)
        share = self.share_repo.get_by_id(
            self.db, uuid.UUID(share_id)
        )
        if not share or share.shopping_list_id != lid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        share = self.share_repo.update_role(self.db, share, role)
        self.db.commit()
        return self._share_to_response(share)

    def remove_share(
        self, list_id: str, share_id: str, user_id: str
    ) -> None:
        self._assert_owner(list_id, user_id)
        lid = uuid.UUID(list_id)
        share = self.share_repo.get_by_id(
            self.db, uuid.UUID(share_id)
        )
        if not share or share.shopping_list_id != lid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self.share_repo.delete(self.db, share)
        self.db.commit()
