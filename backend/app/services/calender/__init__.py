"""Calendar service — orchestration layer for Risk Calendar events.

Responsibilities
─────────────────
* ``list_events``           — read events from DB (with optional filters).
* ``add_event``             — create a user-submitted event.
* ``remove_event``          — delete an event by id.
* ``sync_external_events``  — fetch from providers → upsert into DB.
* ``seed_mock_data``        — populate empty DB with the 10 seed events from
                              the frontend mock data (used when DATA_MODE=mock).
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.crud import calendar as calendar_crud
from app.models.calendar_event import CalendarEvent
from app.providers import holiday_provider, risk_provider, weather_provider

logger = logging.getLogger(__name__)


# ── Mock seed data (mirrors frontend ``portIntelligenceData.ts``) ───────────
MOCK_EVENTS: list[dict] = [
    {
        "id": "ev-1",
        "type": "holiday",
        "title": "Chinese New Year",
        "description": "Major port slowdown across China",
        "detail": (
            "Shanghai and all Chinese ports operate at reduced capacity. "
            "Expect 3-5 day delays on cargo handling. Customs offices closed Feb 28 - Mar 2."
        ),
        "port_id": "shanghai",
        "region": "Asia - East",
        "start_date": "2026-02-28",
        "end_date": "2026-03-05",
        "severity": "High",
    },
    {
        "id": "ev-2",
        "type": "weather",
        "title": "Cyclone Warning — Bay of Bengal",
        "description": "Category 2 cyclone forecast near Indian coast",
        "detail": (
            "IMD has issued a cyclone watch. Mumbai port may suspend operations for 48hrs. "
            "Vessels en route should consider diversion to Mundra or delayed arrival."
        ),
        "port_id": "mumbai",
        "region": "Asia - South",
        "start_date": "2026-03-01",
        "end_date": "2026-03-04",
        "severity": "Critical",
    },
    {
        "id": "ev-3",
        "type": "strike",
        "title": "Santos Dock Workers Strike",
        "description": "Partial strike by dock workers union",
        "detail": (
            "SINDAPORT union has declared a 72hr strike over wage negotiations. "
            "Container handling expected to drop 60%. Bulk cargo unaffected."
        ),
        "port_id": "santos",
        "region": "Americas - South",
        "start_date": "2026-03-02",
        "end_date": "2026-03-04",
        "severity": "High",
    },
    {
        "id": "ev-4",
        "type": "war_risk",
        "title": "Red Sea Transit Risk Elevated",
        "description": "Houthi attacks on commercial shipping continue",
        "detail": (
            "JWC has maintained the Red Sea / Gulf of Aden as a Listed Area. "
            "War risk insurance premiums remain at 0.5-1% of hull value. "
            "Recommend Cape of Good Hope routing."
        ),
        "port_id": None,
        "region": "Middle East",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "severity": "Critical",
    },
    {
        "id": "ev-5",
        "type": "customs_delay",
        "title": "Rotterdam — New EU CBAM Checks",
        "description": "Enhanced carbon border checks causing clearance delays",
        "detail": (
            "EU Carbon Border Adjustment Mechanism Phase 2 enforcement begins. "
            "Steel, aluminium, and cement cargoes face additional 4-8hr clearance. "
            "Ensure CBAM declarations are pre-filed."
        ),
        "port_id": "rotterdam",
        "region": "Europe - North",
        "start_date": "2026-03-01",
        "end_date": "2026-03-31",
        "severity": "Moderate",
    },
    {
        "id": "ev-6",
        "type": "holiday",
        "title": "Holi Festival — India",
        "description": "Indian ports reduced operations",
        "detail": "Government holiday. JNPT customs closed for 1 day. Port operations at ~40% capacity.",
        "port_id": "mumbai",
        "region": "Asia - South",
        "start_date": "2026-03-10",
        "end_date": "2026-03-11",
        "severity": "Low",
    },
    {
        "id": "ev-7",
        "type": "weather",
        "title": "Nor'easter — US East Coast",
        "description": "Winter storm expected NYC/NJ ports",
        "detail": (
            "NWS forecasts 40kt+ winds and heavy snow Mar 6-7. "
            "Port Elizabeth likely to close for 12-18hrs. Recommend pre-positioning or delay."
        ),
        "port_id": "newyork",
        "region": "Americas - North",
        "start_date": "2026-03-06",
        "end_date": "2026-03-08",
        "severity": "High",
    },
    {
        "id": "ev-8",
        "type": "strike",
        "title": "Hamburg Pilot Boat Slowdown",
        "description": "Pilot association work-to-rule action",
        "detail": (
            "Hamburg pilots implementing work-to-rule. Vessel movements restricted "
            "to daylight hours only. Expect 6-12hr delays on arrival/departure."
        ),
        "port_id": "hamburg",
        "region": "Europe - North",
        "start_date": "2026-03-12",
        "end_date": "2026-03-15",
        "severity": "Moderate",
    },
    {
        "id": "ev-9",
        "type": "weather",
        "title": "Typhoon Season Early Start — Pacific",
        "description": "Abnormally early tropical activity near Busan/Shanghai",
        "detail": (
            "JMA tracking tropical depression 200km SE of Okinawa. May intensify. "
            "Busan and Shanghai could see swell/wind impacts by Mar 18."
        ),
        "port_id": None,
        "region": "Asia - East",
        "start_date": "2026-03-16",
        "end_date": "2026-03-20",
        "severity": "Moderate",
    },
    {
        "id": "ev-10",
        "type": "customs_delay",
        "title": "Singapore — PSA System Upgrade",
        "description": "Terminal OS migration causing processing delays",
        "detail": (
            "PSA is migrating to NGTP system. Gate-in/gate-out processing times "
            "increased by 30-45 mins. Pre-advise containers where possible."
        ),
        "port_id": "singapore",
        "region": "Asia - Southeast",
        "start_date": "2026-03-08",
        "end_date": "2026-03-14",
        "severity": "Low",
    },
]


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


async def sync_external_events(db: AsyncSession) -> int:
    """Fetch events from all external providers and upsert into the DB.

    Returns the total number of events synced.
    """
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

    # 3. Risk zones (GDELT + GDACS + static fallback, cached)
    try:
        risks = await risk_provider.fetch_events(db=db)
        all_events.extend(risks)
    except Exception as exc:
        logger.error("Risk provider failed: %s", exc)

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


async def seed_mock_data(db: AsyncSession) -> int:
    """Seed the DB with mock events if the table is empty.

    Used when ``DATA_MODE=mock``.  Returns the count of inserted events.
    """
    existing = await calendar_crud.get_events(db)
    if existing:
        logger.info("Mock seed skipped — %d events already in DB", len(existing))
        return 0

    count = 0
    for event_data in MOCK_EVENTS:
        await calendar_crud.create_event(db, event_data)
        count += 1

    logger.info("Seeded %d mock calendar events", count)
    return count
