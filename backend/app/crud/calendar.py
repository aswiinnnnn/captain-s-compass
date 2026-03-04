"""Async CRUD operations for the ``CalendarEvent`` model.

All functions accept an ``AsyncSession`` and return ORM instances or plain
booleans — no Pydantic conversion happens here (that's the service/endpoint
layer's job).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendar_event import CalendarEvent


async def get_events(
    db: AsyncSession,
    *,
    port_id: str | None = None,
    event_type: str | None = None,
) -> list[CalendarEvent]:
    """Return all events, optionally filtered by port and/or type."""
    query = select(CalendarEvent)
    if port_id:
        query = query.where(CalendarEvent.port_id == port_id)
    if event_type:
        query = query.where(CalendarEvent.type == event_type)
    query = query.order_by(CalendarEvent.start_date)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_event_by_id(db: AsyncSession, event_id: str) -> CalendarEvent | None:
    """Return a single event or ``None``."""
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id)
    )
    return result.scalar_one_or_none()


async def create_event(db: AsyncSession, data: dict) -> CalendarEvent:
    """Insert a new calendar event from a snake_case dict."""
    event = CalendarEvent(**data)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def upsert_event(db: AsyncSession, data: dict) -> CalendarEvent:
    """Insert or update an event keyed by ``id``."""
    existing = await get_event_by_id(db, data["id"])
    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing
    return await create_event(db, data)


async def delete_event(db: AsyncSession, event_id: str) -> bool:
    """Delete an event by id.  Returns ``True`` if it existed."""
    event = await get_event_by_id(db, event_id)
    if event is None:
        return False
    await db.delete(event)
    await db.commit()
    return True
