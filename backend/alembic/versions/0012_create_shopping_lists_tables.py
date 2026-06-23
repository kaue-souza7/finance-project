"""create shopping lists tables (shopping_lists, shopping_list_items)

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("color", sa.String(7), nullable=False),
        sa.Column("icon", sa.String(50), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_shopping_lists_user_id"),
        "shopping_lists",
        ["user_id"],
    )

    op.create_table(
        "shopping_list_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("shopping_list_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("quantity", sa.String(50), nullable=True),
        sa.Column("checked", sa.Boolean(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["shopping_list_id"],
            ["shopping_lists.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        op.f("ix_shopping_list_items_shopping_list_id"),
        "shopping_list_items",
        ["shopping_list_id"],
    )
    op.create_index(
        "ix_items_list_order",
        "shopping_list_items",
        ["shopping_list_id", "order"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_items_list_order", table_name="shopping_list_items"
    )
    op.drop_index(
        op.f("ix_shopping_list_items_shopping_list_id"),
        table_name="shopping_list_items",
    )
    op.drop_table("shopping_list_items")

    op.drop_index(
        op.f("ix_shopping_lists_user_id"),
        table_name="shopping_lists",
    )
    op.drop_table("shopping_lists")
