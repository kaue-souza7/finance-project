"""create chat tables (chats, chat_participants, messages, chat_invites)

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chats",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "chat_participants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chat_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["chat_id"], ["chats.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "chat_id", "user_id", name="uq_chat_participant"
        ),
    )
    op.create_index(
        op.f("ix_chat_participants_chat_id"),
        "chat_participants",
        ["chat_id"],
    )
    op.create_index(
        op.f("ix_chat_participants_user_id"),
        "chat_participants",
        ["user_id"],
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chat_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["chat_id"], ["chats.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_messages_chat_id"), "messages", ["chat_id"]
    )
    op.create_index(
        op.f("ix_messages_sender_id"), "messages", ["sender_id"]
    )
    op.create_index(
        op.f("ix_messages_expires_at"), "messages", ["expires_at"]
    )
    op.create_index(
        "ix_messages_chat_created",
        "messages",
        ["chat_id", "created_at"],
    )

    op.create_table(
        "chat_invites",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("receiver_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["receiver_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_chat_invites_sender_id"),
        "chat_invites",
        ["sender_id"],
    )
    op.create_index(
        op.f("ix_chat_invites_receiver_id"),
        "chat_invites",
        ["receiver_id"],
    )
    op.create_index(
        "ix_chat_invites_receiver_status",
        "chat_invites",
        ["receiver_id", "status"],
    )
    op.create_index(
        "ix_chat_invites_pending_pair",
        "chat_invites",
        ["sender_id", "receiver_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_chat_invites_pending_pair", table_name="chat_invites"
    )
    op.drop_index(
        "ix_chat_invites_receiver_status", table_name="chat_invites"
    )
    op.drop_index(
        op.f("ix_chat_invites_receiver_id"), table_name="chat_invites"
    )
    op.drop_index(
        op.f("ix_chat_invites_sender_id"), table_name="chat_invites"
    )
    op.drop_table("chat_invites")

    op.drop_index(
        "ix_messages_chat_created", table_name="messages"
    )
    op.drop_index(
        op.f("ix_messages_expires_at"), table_name="messages"
    )
    op.drop_index(
        op.f("ix_messages_sender_id"), table_name="messages"
    )
    op.drop_index(
        op.f("ix_messages_chat_id"), table_name="messages"
    )
    op.drop_table("messages")

    op.drop_index(
        op.f("ix_chat_participants_user_id"),
        table_name="chat_participants",
    )
    op.drop_index(
        op.f("ix_chat_participants_chat_id"),
        table_name="chat_participants",
    )
    op.drop_table("chat_participants")

    op.drop_table("chats")
