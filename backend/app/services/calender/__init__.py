"""Calendar service — orchestration layer for Risk Calendar events.

Responsibilities
─────────────────
* ``list_events``          — read events from DB (with optional filters).
* ``add_event``            — create a user-submitted event.
* ``remove_event``         — delete an event by id.
* ``sync_external_events`` — fetch from all providers → upsert into DB.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.calendar import calendar_crud
from app.models.calendar_event import CalendarEvent
from app.providers import holiday_provider, risk_provider, strike_provider, weather_provider

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# Public service functions
# ═══════════════════════════════════════════════════════════════════════════


async def list_events(
    db: AsyncSession,
    port_id: str | None = None,
    event_type: str | None = None,
) -> list[CalendarEvent]:
    """Return calendar events from the DB, optionally filtered."""
    return await calendar_crud.get_events(db, port_id=port_id, event_type=event_type)


async def add_event(db: AsyncSession, data: dict) -> CalendarEvent:
    """Create a single user-submitted event.

    Generates a UUID-based id if none is provided.
    """
    if "id" not in data or not data["id"]:
        data["id"] = f"usr-{uuid.uuid4().hex[:12]}"
    return await calendar_crud.create_event(db, data)


async def remove_event(db: AsyncSession, event_id: str) -> bool:
    """Delete an event by id.  Returns ``True`` if it existed."""
    return await calendar_crud.delete_event(db, event_id)


async def _purge_stale_events(db: AsyncSession) -> int:
    """Delete all calendar events whose end_date is before today.

    Called at the start of every sync so the DB only holds current
    and future data.  Returns the count of deleted rows.
    """
    today = date.today().isoformat()
    result = await db.execute(
        delete(CalendarEvent).where(CalendarEvent.end_date < today)
    )
    await db.commit()
    purged = result.rowcount
    if purged:
        logger.info("Purged %d stale calendar events (end_date < %s)", purged, today)
    return purged


async def sync_external_events(db: AsyncSession) -> int:
    """Purge stale rows, then fetch events from all external providers and
    upsert into the DB.

    Returns the total number of events synced.
    """
    # Clean up anything that has already passed before writing fresh data
    await _purge_stale_events(db)

    all_events: list[dict] = []

    # 1. Holidays (Nager.Date)
    try:
        holidays = await holiday_provider.fetch_events()
        all_events.extend(holidays)
    except Exception as exc:
        logger.error("Holiday provider failed: %s", exc)

    # 2. Weather (Open-Meteo)
    try:
        weather = await weather_provider.fetch_events()
        all_events.extend(weather)
    except Exception as exc:
        logger.error("Weather provider failed: %s", exc)

    # 3. War / security risk zones + canal disruptions (Tavily)
    try:
        risks = await risk_provider.fetch_events()
        all_events.extend(risks)
    except Exception as exc:
        logger.error("Risk provider failed: %s", exc)

    # 4. Port strikes & labour actions (Tavily)
    try:
        strikes = await strike_provider.fetch_events()
        all_events.extend(strikes)
    except Exception as exc:
        logger.error("Strike provider failed: %s", exc)

    # Upsert everything
    count = 0
    for event_data in all_events:
        try:
            await calendar_crud.upsert_event(db, event_data)
            count += 1
        except Exception as exc:
            logger.warning("Failed to upsert event %s: %s", event_data.get("id"), exc)

    logger.info("Synced %d / %d events from external providers", count, len(all_events))
    return count

