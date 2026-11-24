"""create additional organizations tables

Revision ID: 0017
Revises: 0016
Create Date: 2026-11-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "additional_organizations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column(
            "show_observations",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "type IN ('free_text', 'additional_income')",
            name="ck_additional_organizations_type_valid",
        ),
        sa.CheckConstraint(
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
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_additional_organizations_user_id"),
        "additional_organizations",
        ["user_id"],
    )
    op.create_index(
        "ix_additional_organizations_user_updated_at",
        "additional_organizations",
        ["user_id", "updated_at"],
    )

    op.create_table(
        "additional_organization_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("observation", sa.String(500), nullable=True),
        sa.Column(
            "position", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "amount > 0",
            name="ck_additional_organization_items_amount_positive",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["additional_organizations.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_additional_organization_items_organization_id"),
        "additional_organization_items",
        ["organization_id"],
    )
    op.create_index(
        "ix_additional_organization_items_org_position",
        "additional_organization_items",
        ["organization_id", "position"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_additional_organization_items_org_position",
        table_name="additional_organization_items",
    )
    op.drop_index(
        op.f("ix_additional_organization_items_organization_id"),
        table_name="additional_organization_items",
    )
    op.drop_table("additional_organization_items")

    op.drop_index(
        "ix_additional_organizations_user_updated_at",
        table_name="additional_organizations",
    )
    op.drop_index(
        op.f("ix_additional_organizations_user_id"),
        table_name="additional_organizations",
    )
    op.drop_table("additional_organizations")
