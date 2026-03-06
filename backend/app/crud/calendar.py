"""Calendar CRUD — inherits the async CRUDBase.

Only methods that cannot be covered by the base are defined here:
- ``get_events``   : filtered + ordered list (custom WHERE/ORDER BY)
- ``create_event`` : accepts a raw ``dict`` instead of a Pydantic schema
- ``upsert_event`` : insert-or-update by id (not available in base)
- ``delete_event`` : id-based delete (base ``remove`` requires the ORM obj)

All generic operations (``get``, ``get_multi``, ``create``, ``update``,
``remove``) are inherited directly from ``CRUDBase`` and work as-is.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.calendar_event import CalendarEvent
from app.schemas.calender import EventCreateSchema, EventUpdateSchema


class CRUDCalendar(CRUDBase[CalendarEvent, EventCreateSchema, EventUpdateSchema]):
    """Calendar-specific CRUD with async query methods."""

    # ── Read ──────────────────────────────────────────────────────────────

    async def get_events(
        self,
        db: AsyncSession,
        port_id: str | None = None,
        event_type: str | None = None,
    ) -> list[CalendarEvent]:
        """Return current and future events ordered by start_date.

        Only events whose ``end_date`` is today or later are returned.
        Past events remain in the DB (for auditing) but are never exposed
        through the API — they are purged on the next sync.
        """
        today = date.today().isoformat()
        q = (
            select(CalendarEvent)
            .where(CalendarEvent.end_date >= today)
            .order_by(CalendarEvent.start_date)
        )
        if port_id:
            q = q.where(CalendarEvent.port_id == port_id)
        if event_type:
            q = q.where(CalendarEvent.type == event_type)
        result = await db.execute(q)
        return list(result.scalars().all())

    # ── Write ─────────────────────────────────────────────────────────────

    async def create_event(
        self,
        db: AsyncSession,
        data: dict,
    ) -> CalendarEvent:
        """Insert a new calendar event and return the persisted instance."""
        event = CalendarEvent(**data)
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    async def upsert_event(
        self,
        db: AsyncSession,
        data: dict,
    ) -> CalendarEvent:
        """Insert or update a calendar event keyed on ``data['id']``."""
        result = await db.execute(
            select(CalendarEvent).where(CalendarEvent.id == data["id"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            await db.commit()
            await db.refresh(existing)
            return existing
        return await self.create_event(db, data)

    # ── Delete ────────────────────────────────────────────────────────────

    async def delete_event(
        self,
        db: AsyncSession,
        event_id: str,
    ) -> bool:
        """Delete an event by id.  Returns ``True`` if the row existed."""
        result = await db.execute(
            select(CalendarEvent).where(CalendarEvent.id == event_id)
        )
        event = result.scalar_one_or_none()
        if event is None:
            return False
        await db.delete(event)
        await db.commit()
        return True


# Singleton instance used throughout the service layer
calendar_crud = CRUDCalendar(CalendarEvent)