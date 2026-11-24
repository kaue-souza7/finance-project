import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class AdditionalOrganizationInvite(Base):
    __tablename__ = "additional_organization_invites"
    __table_args__ = (
        CheckConstraint(
            "status IN "
            "('pending', 'accepted', 'declined', 'cancelled', 'expired')",
            name="ck_ao_invites_status_valid",
        ),
        CheckConstraint(
            "email_status IN "
            "('queued', 'sent', 'failed', 'unavailable')",
            name="ck_ao_invites_email_status_valid",
        ),
        CheckConstraint(
            "invited_email = lower(invited_email)",
            name="ck_ao_invites_email_normalized",
        ),
        Index(
            "ix_ao_invites_pending_email",
            "organization_id",
            "invited_email",
            unique=True,
            postgresql_where=text("status = 'pending'"),
            sqlite_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("additional_organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    invited_email: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    receiver_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    email_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="queued"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    organization = relationship(
        "AdditionalOrganization", back_populates="invites"
    )
    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        back_populates="sent_additional_organization_invites",
    )
    receiver = relationship(
        "User",
        foreign_keys=[receiver_user_id],
        back_populates="received_additional_organization_invites",
    )
