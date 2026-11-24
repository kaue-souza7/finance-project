import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_opaque_token, hash_opaque_token
from app.database.session import SessionLocal
from app.models.additional_organization import AdditionalOrganization
from app.models.additional_organization_invite import (
    AdditionalOrganizationInvite,
)
from app.repositories.additional_organization_invite_repository import (
    AdditionalOrganizationInviteRepository,
)
from app.repositories.additional_organization_member_repository import (
    AdditionalOrganizationMemberRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.additional_organization_sharing import (
    AdditionalOrganizationInvitePreviewResponse,
    AdditionalOrganizationInviteResponse,
    AdditionalOrganizationParticipantResponse,
)
from app.services.additional_organization_access_service import (
    AdditionalOrganizationAccessService,
)
from app.services.email_service import (
    send_additional_organization_invite_email,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class InviteSendResult:
    response: AdditionalOrganizationInviteResponse
    raw_token: str
    token_hash: str
    email_status: str
    invited_email: str
    organization_title: str
    sender_name: str
    expires_at: datetime


class AdditionalOrganizationSharingService:
    def __init__(self, db: Session):
        self.db = db
        self.access = AdditionalOrganizationAccessService(db)
        self.member_repo = AdditionalOrganizationMemberRepository()
        self.invite_repo = AdditionalOrganizationInviteRepository()
        self.user_repo = UserRepository()

    def _expire_overdue(self) -> None:
        updated = self.invite_repo.expire_overdue(self.db)
        if updated:
            self.db.commit()

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _initial_email_status() -> str:
        return "queued" if settings.SMTP_HOST else "unavailable"

    def _invite_response(
        self, invite: AdditionalOrganizationInvite
    ) -> AdditionalOrganizationInviteResponse:
        organization = invite.organization
        sender = invite.sender
        return AdditionalOrganizationInviteResponse(
            id=invite.id,
            organization_id=invite.organization_id,
            organization_title=(
                organization.title
                if organization is not None
                else "Organização Adicional"
            ),
            sender_id=invite.sender_id,
            sender_name=sender.name if sender is not None else "Usuário",
            sender_email=(
                sender.email if sender is not None else ""
            ),
            invited_email=invite.invited_email,
            receiver_user_id=invite.receiver_user_id,
            status=invite.status,
            email_status=invite.email_status,
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            last_sent_at=invite.last_sent_at,
            responded_at=invite.responded_at,
        )

    def list_participants(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[AdditionalOrganizationParticipantResponse]:
        access = self.access.get_accessible(organization_id, user_id)
        organization = access.organization
        owner = organization.user
        participants = [
            AdditionalOrganizationParticipantResponse(
                membership_id=None,
                user_id=owner.id,
                name=owner.name,
                email=owner.email,
                avatar_url=owner.avatar_url,
                role="owner",
                joined_at=None,
            )
        ]

        for member in self.member_repo.list_by_organization(
            self.db, organization.id
        ):
            if member.user_id == owner.id:
                continue
            participants.append(
                AdditionalOrganizationParticipantResponse(
                    membership_id=member.id,
                    user_id=member.user.id,
                    name=member.user.name,
                    email=member.user.email,
                    avatar_url=member.user.avatar_url,
                    role="participant",
                    joined_at=member.created_at,
                )
            )

        return participants

    def list_invites(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[AdditionalOrganizationInviteResponse]:
        self.access.get_owned_or_403(organization_id, user_id)
        self._expire_overdue()
        invites = self.invite_repo.list_by_organization(
            self.db, organization_id
        )
        return [self._invite_response(invite) for invite in invites]

    def _assert_invitable(
        self,
        organization: AdditionalOrganization,
        email: str,
    ) -> tuple[uuid.UUID | None, uuid.UUID | None]:
        owner = organization.user
        if owner.email.strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você não pode convidar a si mesmo",
            )

        receiver = self.user_repo.get_by_email(self.db, email)
        if receiver:
            member = self.member_repo.get_by_org_and_user(
                self.db, organization.id, receiver.id
            )
            if member:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Esta pessoa já participa da organização",
                )

        pending = self.invite_repo.get_pending_by_org_and_email(
            self.db, organization.id, email
        )
        if pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um convite pendente para este e-mail",
            )

        return receiver.id if receiver else None, owner.id

    def send_invite(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        email: str,
    ) -> InviteSendResult:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        self._expire_overdue()
        normalized_email = self._normalize_email(email)
        receiver_user_id, sender_id = self._assert_invitable(
            organization, normalized_email
        )

        raw_token = generate_opaque_token()
        token_hash = hash_opaque_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.ADDITIONAL_ORGANIZATION_INVITE_EXPIRE_DAYS
        )
        email_status = self._initial_email_status()

        try:
            invite = self.invite_repo.create(
                self.db,
                organization.id,
                sender_id,
                normalized_email,
                receiver_user_id,
                token_hash,
                expires_at,
                email_status,
            )
            self.db.commit()
            self.db.refresh(invite)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um convite pendente para este e-mail",
            ) from None
        except Exception:
            self.db.rollback()
            raise

        return InviteSendResult(
            response=self._invite_response(invite),
            raw_token=raw_token,
            token_hash=token_hash,
            email_status=invite.email_status,
            invited_email=invite.invited_email,
            organization_title=organization.title,
            sender_name=organization.user.name,
            expires_at=invite.expires_at,
        )

    def resend_invite(
        self,
        organization_id: uuid.UUID,
        invite_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> InviteSendResult:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        self._expire_overdue()

        invite = self.invite_repo.get_by_id_for_update(
            self.db, invite_id
        )
        if not invite or invite.organization_id != organization.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado",
            )
        if invite.status == "expired":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite expirado; envie um novo convite",
            )
        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Apenas convites pendentes podem ser reenviados",
            )

        owner = organization.user
        if owner.email.strip().lower() == invite.invited_email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você não pode convidar a si mesmo",
            )

        receiver = self.user_repo.get_by_email(
            self.db, invite.invited_email
        )
        if receiver:
            member = self.member_repo.get_by_org_and_user(
                self.db, organization.id, receiver.id
            )
            if member:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Esta pessoa já participa da organização",
                )
            invite.receiver_user_id = receiver.id

        raw_token = generate_opaque_token()
        token_hash = hash_opaque_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.ADDITIONAL_ORGANIZATION_INVITE_EXPIRE_DAYS
        )
        email_status = self._initial_email_status()
        self.invite_repo.update_token(
            self.db,
            invite,
            token_hash,
            expires_at,
            email_status,
        )
        self.db.commit()
        self.db.refresh(invite)

        return InviteSendResult(
            response=self._invite_response(invite),
            raw_token=raw_token,
            token_hash=token_hash,
            email_status=invite.email_status,
            invited_email=invite.invited_email,
            organization_title=organization.title,
            sender_name=owner.name,
            expires_at=invite.expires_at,
        )

    def cancel_invite(
        self,
        organization_id: uuid.UUID,
        invite_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        self._expire_overdue()

        invite = self.invite_repo.get_by_id_for_update(
            self.db, invite_id
        )
        if not invite or invite.organization_id != organization.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado",
            )
        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Apenas convites pendentes podem ser cancelados",
            )

        self.invite_repo.update_status(self.db, invite, "cancelled")
        self.db.commit()

    def remove_participant(
        self,
        organization_id: uuid.UUID,
        member_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        member = self.member_repo.get_by_id_and_org(
            self.db, member_id, organization.id
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participante não encontrado",
            )
        self.member_repo.delete(self.db, member)
        self.db.commit()

    def _claim_invites_for_user(
        self, user_id: uuid.UUID, user_email: str
    ) -> None:
        normalized_email = self._normalize_email(user_email)
        invites = self.invite_repo.list_unclaimed_pending_by_email(
            self.db, normalized_email
        )
        for invite in invites:
            self.invite_repo.claim_for_user(self.db, invite, user_id)
        if invites:
            self.db.commit()

    def list_received_invites(
        self, user_id: uuid.UUID, user_email: str
    ) -> list[AdditionalOrganizationInviteResponse]:
        self._expire_overdue()
        self._claim_invites_for_user(user_id, user_email)
        invites = self.invite_repo.list_pending_by_receiver(
            self.db, user_id
        )
        return [self._invite_response(invite) for invite in invites]

    def _get_invite_for_recipient(
        self, invite_id: uuid.UUID, user_id: uuid.UUID, user_email: str
    ) -> AdditionalOrganizationInvite:
        self._expire_overdue()
        invite = self.invite_repo.get_by_id_for_update(
            self.db, invite_id
        )
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado",
            )

        normalized_email = self._normalize_email(user_email)
        if (
            invite.receiver_user_id is None
            and invite.invited_email == normalized_email
        ):
            self.invite_repo.claim_for_user(self.db, invite, user_id)

        if invite.receiver_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado",
            )

        return invite

    def accept_invite(
        self, invite_id: uuid.UUID, user_id: uuid.UUID, user_email: str
    ) -> AdditionalOrganizationInviteResponse:
        invite = self._get_invite_for_recipient(
            invite_id, user_id, user_email
        )

        if invite.status == "expired":
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Este convite expirou. Peça um novo convite.",
            )
        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        if invite.organization.user_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você já é proprietário desta organização",
            )

        existing = self.member_repo.get_by_org_and_user(
            self.db, invite.organization_id, user_id
        )
        if existing:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
            return self._invite_response(invite)

        try:
            self.member_repo.create(
                self.db, invite.organization_id, user_id
            )
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
        except IntegrityError:
            self.db.rollback()
            invite = self.invite_repo.get_by_id(self.db, invite_id)
            if not invite:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Convite não encontrado",
                ) from None
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
        except Exception:
            self.db.rollback()
            raise

        return self._invite_response(invite)

    def decline_invite(
        self, invite_id: uuid.UUID, user_id: uuid.UUID, user_email: str
    ) -> AdditionalOrganizationInviteResponse:
        invite = self._get_invite_for_recipient(
            invite_id, user_id, user_email
        )
        if invite.status == "expired":
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Este convite expirou. Peça um novo convite.",
            )
        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        self.invite_repo.update_status(self.db, invite, "declined")
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_response(invite)

    def resolve_invite_token(
        self, token: str, user_id: uuid.UUID, user_email: str
    ) -> AdditionalOrganizationInvitePreviewResponse:
        self._expire_overdue()
        invite = self.invite_repo.get_by_token_hash(
            self.db, hash_opaque_token(token)
        )
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite inválido ou não encontrado",
            )

        normalized_email = self._normalize_email(user_email)
        if (
            invite.receiver_user_id is None
            and invite.invited_email == normalized_email
        ):
            self.invite_repo.claim_for_user(self.db, invite, user_id)
            self.db.commit()

        if invite.receiver_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado",
            )

        return AdditionalOrganizationInvitePreviewResponse(
            invite_id=invite.id,
            organization_id=invite.organization_id,
            title=invite.organization.title,
            type=invite.organization.type,
            owner_name=invite.sender.name,
            expires_at=invite.expires_at,
            status=invite.status,
        )


def build_additional_organization_invite_link(raw_token: str) -> str:
    return (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/organizacao-adicional/convite?token={raw_token}"
    )


def send_additional_organization_invite_email_task(
    invite_id: uuid.UUID,
    to_email: str,
    invite_link: str,
    owner_name: str,
    organization_title: str,
    expires_at: datetime,
    token_hash: str,
) -> None:
    """Executa em background e atualiza o status real do envio."""
    db = SessionLocal()
    try:
        invite = AdditionalOrganizationInviteRepository.get_by_id(
            db, invite_id
        )
        if (
            not invite
            or invite.status != "pending"
            or invite.token_hash != token_hash
        ):
            return

        sent = send_additional_organization_invite_email(
            to_email,
            invite_link,
            owner_name,
            organization_title,
            expires_at.strftime("%d/%m/%Y %H:%M UTC"),
        )
        db.refresh(invite)
        if (
            invite.status != "pending"
            or invite.token_hash != token_hash
        ):
            return
        AdditionalOrganizationInviteRepository.set_email_status(
            db, invite, "sent" if sent else "failed"
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception(
            "Falha ao processar envio de convite (invite_id=%s)",
            invite_id,
        )
    finally:
        db.close()
