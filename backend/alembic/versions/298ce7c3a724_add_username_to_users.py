"""add username to users

Revision ID: 298ce7c3a724
Revises: 23aecfd34d6c
Create Date: 2026-05-04 18:32:15.110078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '298ce7c3a724'
down_revision: Union[str, Sequence[str], None] = '23aecfd34d6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("username", sa.String(), nullable=True))
    op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "username")
