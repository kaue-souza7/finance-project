import uuid
from datetime import datetime, timezone

from typing import Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    avatar_public_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    plannings = relationship("Planning", back_populates="user")
    categories = relationship("Category", back_populates="user")
    leisure_events = relationship("LeisureEvent", back_populates="owner")
    leisure_expenses = relationship("LeisureExpense", back_populates="creator")
    leisure_participations = relationship(
        "LeisureParticipant", back_populates="user"
    )
    sent_invites = relationship(
        "LeisureInvite",
        foreign_keys="LeisureInvite.sender_id",
        back_populates="sender",
    )
    received_invites = relationship(
        "LeisureInvite",
        foreign_keys="LeisureInvite.receiver_user_id",
        back_populates="receiver",
    )
    chat_participations = relationship(
        "ChatParticipant", back_populates="user"
    )
    sent_chat_invites = relationship(
        "ChatInvite",
        foreign_keys="ChatInvite.sender_id",
        back_populates="sender",
    )
    received_chat_invites = relationship(
        "ChatInvite",
        foreign_keys="ChatInvite.receiver_id",
        back_populates="receiver",
    )
    messages = relationship("Message", back_populates="sender")
    shopping_lists = relationship("ShoppingList", back_populates="user")
    sent_shopping_list_invites = relationship(
        "ShoppingListInvite",
        foreign_keys="ShoppingListInvite.sender_id",
        back_populates="sender",
    )
    received_shopping_list_invites = relationship(
        "ShoppingListInvite",
        foreign_keys="ShoppingListInvite.receiver_user_id",
        back_populates="receiver",
    )
    shared_shopping_lists = relationship(
        "ShoppingListShare",
        foreign_keys="ShoppingListShare.user_id",
        back_populates="user",
    )
    created_shopping_list_shares = relationship(
        "ShoppingListShare",
        foreign_keys="ShoppingListShare.created_by",
        back_populates="creator",
    )
    webauthn_credentials = relationship(
        "WebAuthnCredential", back_populates="user", cascade="all, delete-orphan"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
