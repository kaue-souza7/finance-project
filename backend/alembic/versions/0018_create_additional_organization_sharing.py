"""create additional organization sharing structures

Revision ID: 0018
Revises: 0017
Create Date: 2026-11-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0018"
down_revision: Union[str, None] = "0017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "additional_organizations",
        sa.Column(
            "content_version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )

    op.create_table(
        "additional_organization_members",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["additional_organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "user_id",
            name="uq_ao_member_org_user",
        ),
    )
    op.create_index(
        op.f("ix_additional_organization_members_organization_id"),
        "additional_organization_members",
        ["organization_id"],
    )
    op.create_index(
        op.f("ix_additional_organization_members_user_id"),
        "additional_organization_members",
        ["user_id"],
    )

    op.create_table(
        "additional_organization_invites",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("sender_id", sa.Uuid(), nullable=False),
        sa.Column("invited_email", sa.String(255), nullable=False),
        sa.Column("receiver_user_id", sa.Uuid(), nullable=True),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("email_status", sa.String(20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "expires_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column(
            "last_sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "responded_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.CheckConstraint(
            "status IN "
            "('pending', 'accepted', 'declined', 'cancelled', 'expired')",
            name="ck_ao_invites_status_valid",
        ),
        sa.CheckConstraint(
            "email_status IN "
            "('queued', 'sent', 'failed', 'unavailable')",
            name="ck_ao_invites_email_status_valid",
        ),
        sa.CheckConstraint(
            "invited_email = lower(invited_email)",
            name="ck_ao_invites_email_normalized",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["additional_organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["receiver_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        op.f("ix_additional_organization_invites_organization_id"),
        "additional_organization_invites",
        ["organization_id"],
    )
    op.create_index(
        op.f("ix_additional_organization_invites_invited_email"),
        "additional_organization_invites",
        ["invited_email"],
    )
    op.create_index(
        op.f("ix_additional_organization_invites_receiver_user_id"),
        "additional_organization_invites",
        ["receiver_user_id"],
    )
    op.create_index(
        op.f("ix_additional_organization_invites_token_hash"),
        "additional_organization_invites",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_ao_invites_pending_email",
        "additional_organization_invites",
        ["organization_id", "invited_email"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ao_invites_pending_email",
        table_name="additional_organization_invites",
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.drop_index(
        op.f("ix_additional_organization_invites_token_hash"),
        table_name="additional_organization_invites",
    )
    op.drop_index(
        op.f("ix_additional_organization_invites_receiver_user_id"),
        table_name="additional_organization_invites",
    )
    op.drop_index(
        op.f("ix_additional_organization_invites_invited_email"),
        table_name="additional_organization_invites",
    )
    op.drop_index(
        op.f("ix_additional_organization_invites_organization_id"),
        table_name="additional_organization_invites",
    )
    op.drop_table("additional_organization_invites")

    op.drop_index(
        op.f("ix_additional_organization_members_user_id"),
        table_name="additional_organization_members",
    )
    op.drop_index(
        op.f("ix_additional_organization_members_organization_id"),
        table_name="additional_organization_members",
    )
    op.drop_table("additional_organization_members")

    op.drop_column("additional_organizations", "content_version")
