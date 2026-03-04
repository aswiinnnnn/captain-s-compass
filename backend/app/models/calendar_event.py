"""Calendar event model."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base


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
