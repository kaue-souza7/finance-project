import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.additional_organization_invite import (
    AdditionalOrganizationInvite,
)


class AdditionalOrganizationInviteRepository:
    @staticmethod
    def get_by_id(
        db: Session, invite_id: uuid.UUID
    ) -> AdditionalOrganizationInvite | None:
        return (
            db.query(AdditionalOrganizationInvite)
            .options(
                joinedload(AdditionalOrganizationInvite.organization),
                joinedload(AdditionalOrganizationInvite.sender),
                joinedload(AdditionalOrganizationInvite.receiver),
            )
            .filter(AdditionalOrganizationInvite.id == invite_id)
            .first()
        )

    @staticmethod
    def get_by_id_for_update(
        db: Session, invite_id: uuid.UUID
    ) -> AdditionalOrganizationInvite | None:
        return (
            db.query(AdditionalOrganizationInvite)
            .filter(AdditionalOrganizationInvite.id == invite_id)
            .with_for_update()
            .first()
        )

    @staticmethod
    def get_by_token_hash(
        db: Session, token_hash: str
    ) -> AdditionalOrganizationInvite | None:
        return (
            db.query(AdditionalOrganizationInvite)
            .options(
                joinedload(AdditionalOrganizationInvite.organization),
                joinedload(AdditionalOrganizationInvite.sender),
            )
            .filter(AdditionalOrganizationInvite.token_hash == token_hash)
            .first()
        )

    @staticmethod
    def get_pending_by_org_and_email(
        db: Session, organization_id: uuid.UUID, invited_email: str
    ) -> AdditionalOrganizationInvite | None:
        return (
            db.query(AdditionalOrganizationInvite)
            .filter(
                AdditionalOrganizationInvite.organization_id
                == organization_id,
                AdditionalOrganizationInvite.invited_email
                == invited_email,
                AdditionalOrganizationInvite.status == "pending",
            )
            .first()
        )

    @staticmethod
    def list_by_organization(
        db: Session, organization_id: uuid.UUID
    ) -> list[AdditionalOrganizationInvite]:
        return (
            db.query(AdditionalOrganizationInvite)
            .options(
                joinedload(AdditionalOrganizationInvite.sender),
                joinedload(AdditionalOrganizationInvite.receiver),
                joinedload(AdditionalOrganizationInvite.organization),
            )
            .filter(
                AdditionalOrganizationInvite.organization_id
                == organization_id
            )
            .order_by(AdditionalOrganizationInvite.created_at.desc())
            .all()
        )

    @staticmethod
    def list_pending_by_receiver(
        db: Session, user_id: uuid.UUID
    ) -> list[AdditionalOrganizationInvite]:
        return (
            db.query(AdditionalOrganizationInvite)
            .options(
                joinedload(AdditionalOrganizationInvite.organization),
                joinedload(AdditionalOrganizationInvite.sender),
            )
            .filter(
                AdditionalOrganizationInvite.receiver_user_id == user_id,
                AdditionalOrganizationInvite.status == "pending",
            )
            .order_by(AdditionalOrganizationInvite.created_at.desc())
            .all()
        )

    @staticmethod
    def list_unclaimed_pending_by_email(
        db: Session, email: str
    ) -> list[AdditionalOrganizationInvite]:
        return (
            db.query(AdditionalOrganizationInvite)
            .filter(
                AdditionalOrganizationInvite.receiver_user_id.is_(None),
                AdditionalOrganizationInvite.invited_email == email,
                AdditionalOrganizationInvite.status == "pending",
            )
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        organization_id: uuid.UUID,
        sender_id: uuid.UUID,
        invited_email: str,
        receiver_user_id: uuid.UUID | None,
        token_hash: str,
        expires_at: datetime,
        email_status: str,
    ) -> AdditionalOrganizationInvite:
        now = datetime.now(timezone.utc)
        invite = AdditionalOrganizationInvite(
            organization_id=organization_id,
            sender_id=sender_id,
            invited_email=invited_email,
            receiver_user_id=receiver_user_id,
            token_hash=token_hash,
            status="pending",
            email_status=email_status,
            expires_at=expires_at,
            last_sent_at=now,
        )
        db.add(invite)
        db.flush()
        return invite

    @staticmethod
    def update_status(
        db: Session,
        invite: AdditionalOrganizationInvite,
        status: str,
    ) -> AdditionalOrganizationInvite:
        invite.status = status
        invite.responded_at = datetime.now(timezone.utc)
        db.flush()
        return invite

    @staticmethod
    def update_token(
        db: Session,
        invite: AdditionalOrganizationInvite,
        token_hash: str,
        expires_at: datetime,
        email_status: str,
    ) -> AdditionalOrganizationInvite:
        invite.token_hash = token_hash
        invite.expires_at = expires_at
        invite.last_sent_at = datetime.now(timezone.utc)
        invite.email_status = email_status
        db.flush()
        return invite

    @staticmethod
    def set_email_status(
        db: Session,
        invite: AdditionalOrganizationInvite,
        email_status: str,
    ) -> None:
        invite.email_status = email_status
        db.flush()

    @staticmethod
    def claim_for_user(
        db: Session,
        invite: AdditionalOrganizationInvite,
        user_id: uuid.UUID,
    ) -> None:
        if invite.receiver_user_id is None:
            invite.receiver_user_id = user_id
            db.flush()

    @staticmethod
    def expire_overdue(db: Session) -> int:
        now = datetime.now(timezone.utc)
        return (
            db.query(AdditionalOrganizationInvite)
            .filter(
                AdditionalOrganizationInvite.status == "pending",
                AdditionalOrganizationInvite.expires_at <= now,
            )
            .update(
                {
                    AdditionalOrganizationInvite.status: "expired",
                    AdditionalOrganizationInvite.responded_at: now,
                },
                synchronize_session=False,
            )
        )
