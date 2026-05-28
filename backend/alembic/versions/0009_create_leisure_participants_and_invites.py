"""create leisure_participants and leisure_invites tables

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leisure_participants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("leisure_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["leisure_id"], ["leisure_events.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "leisure_id", "user_id", name="uq_leisure_participant"
        ),
    )
    op.create_index(
        op.f("ix_leisure_participants_leisure_id"),
        "leisure_participants",
        ["leisure_id"],
    )

    op.create_table(
        "leisure_invites",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("leisure_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("receiver_user_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["leisure_id"], ["leisure_events.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["receiver_user_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_leisure_invites_leisure_id"),
        "leisure_invites",
        ["leisure_id"],
    )
    op.create_index(
        op.f("ix_leisure_invites_receiver_user_id"),
        "leisure_invites",
        ["receiver_user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_leisure_invites_receiver_user_id"),
        table_name="leisure_invites",
    )
    op.drop_index(
        op.f("ix_leisure_invites_leisure_id"), table_name="leisure_invites"
    )
    op.drop_table("leisure_invites")
    op.drop_index(
        op.f("ix_leisure_participants_leisure_id"),
        table_name="leisure_participants",
    )
    op.drop_table("leisure_participants")
