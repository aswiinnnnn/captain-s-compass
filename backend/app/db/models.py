"""SQLAlchemy ORM models for app-owned data."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Port(Base):
    """App-owned port record (editable by port employees)."""

    __tablename__ = "ports"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    country: Mapped[str] = mapped_column(String(100))
    region: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(10))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    anchorage_cost_per_day: Mapped[float] = mapped_column(Float, default=0)
    berth_cost_per_hour: Mapped[float] = mapped_column(Float, default=0)
    equipment: Mapped[dict] = mapped_column(JSON, default=list)
    estimated_handling_time_hrs: Mapped[float] = mapped_column(Float, default=24)
    congestion_level: Mapped[str] = mapped_column(String(20), default="Low")
    last_updated_by: Mapped[str] = mapped_column(String(100), default="system")
    last_updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CalendarEvent(Base):
    """Port-related events (holidays, strikes, weather, etc.)."""

    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    type: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    detail: Mapped[str] = mapped_column(Text)
    port_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    region: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[str] = mapped_column(String(20))
    end_date: Mapped[str] = mapped_column(String(20))
    severity: Mapped[str] = mapped_column(String(20))


class ProviderCache(Base):
    """Generic cache for external provider responses."""

    __tablename__ = "provider_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(50))
    key: Mapped[str] = mapped_column(String(500))
    payload: Mapped[dict] = mapped_column(JSON)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
