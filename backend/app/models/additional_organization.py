import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class AdditionalOrganization(Base):
    __tablename__ = "additional_organizations"
    __table_args__ = (
        CheckConstraint(
            "type IN ('free_text', 'additional_income')",
            name="ck_additional_organizations_type_valid",
        ),
        CheckConstraint(
            "(type = 'free_text' "
            "AND total_amount IS NULL "
            "AND show_observations = false) "
            "OR "
            "(type = 'additional_income' "
            "AND total_amount IS NOT NULL "
            "AND total_amount > 0 "
            "AND content IS NULL)",
            name="ck_additional_organizations_type_fields",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    show_observations: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    content_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="additional_organizations")
    items = relationship(
        "AdditionalOrganizationItem",
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by=(
            "AdditionalOrganizationItem.position.asc(), "
            "AdditionalOrganizationItem.created_at.asc()"
        ),
    )
    members = relationship(
        "AdditionalOrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    invites = relationship(
        "AdditionalOrganizationInvite",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
