"""add category_id to expenses

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "expenses",
        sa.Column(
            "category_id",
            sa.UUID(),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_expenses_category_id"), "expenses", ["category_id"]
    )
    op.create_foreign_key(
        "fk_expenses_category_id_categories",
        "expenses",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_expenses_category_id_categories", "expenses", type_="foreignkey"
    )
    op.drop_index(op.f("ix_expenses_category_id"), table_name="expenses")
    op.drop_column("expenses", "category_id")
