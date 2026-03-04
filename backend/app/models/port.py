"""Port model."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


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
