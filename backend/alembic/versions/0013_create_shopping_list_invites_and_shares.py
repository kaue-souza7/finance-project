"""create shopping list invites and shares tables

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shopping_list_invites",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("shopping_list_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("receiver_user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column(
            "responded_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["shopping_list_id"],
            ["shopping_lists.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["receiver_user_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_shopping_list_invites_shopping_list_id"),
        "shopping_list_invites",
        ["shopping_list_id"],
    )
    op.create_index(
        op.f("ix_shopping_list_invites_receiver_user_id"),
        "shopping_list_invites",
        ["receiver_user_id"],
    )
    op.create_index(
        "ix_sl_invites_pending_pair",
        "shopping_list_invites",
        ["shopping_list_id", "receiver_user_id"],
        postgresql_where=sa.text("status = 'pending'"),
        unique=True,
    )

    op.create_table(
        "shopping_list_shares",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("shopping_list_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column(
            "last_seen_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["shopping_list_id"],
            ["shopping_lists.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "shopping_list_id",
            "user_id",
            name="uq_sl_share_pair",
        ),
    )
    op.create_index(
        op.f("ix_shopping_list_shares_shopping_list_id"),
        "shopping_list_shares",
        ["shopping_list_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_shopping_list_shares_shopping_list_id"),
        table_name="shopping_list_shares",
    )
    op.drop_table("shopping_list_shares")

    op.drop_index(
        "ix_sl_invites_pending_pair",
        table_name="shopping_list_invites",
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.drop_index(
        op.f("ix_shopping_list_invites_receiver_user_id"),
        table_name="shopping_list_invites",
    )
    op.drop_index(
        op.f("ix_shopping_list_invites_shopping_list_id"),
        table_name="shopping_list_invites",
    )
    op.drop_table("shopping_list_invites")
