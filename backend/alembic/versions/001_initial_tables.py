"""Initial tables: ports, calendar_events, provider_cache

Revision ID: 001
Revises:
Create Date: 2026-03-04
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ports",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("code", sa.String(10), nullable=False),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
        sa.Column("anchorage_cost_per_day", sa.Float, default=0),
        sa.Column("berth_cost_per_hour", sa.Float, default=0),
        sa.Column("equipment", sa.JSON, default=list),
        sa.Column("estimated_handling_time_hrs", sa.Float, default=24),
        sa.Column("congestion_level", sa.String(20), default="Low"),
        sa.Column("last_updated_by", sa.String(100), default="system"),
        sa.Column("last_updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "calendar_events",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("detail", sa.Text, nullable=False),
        sa.Column("port_id", sa.String(50), nullable=True),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("start_date", sa.String(20), nullable=False),
        sa.Column("end_date", sa.String(20), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
    )

    op.create_table(
        "provider_cache",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("key", sa.String(500), nullable=False),
        sa.Column("payload", sa.JSON, nullable=False),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("provider_cache")
    op.drop_table("calendar_events")
    op.drop_table("ports")
