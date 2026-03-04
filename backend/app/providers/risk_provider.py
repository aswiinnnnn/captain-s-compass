"""Risk-zone provider — orchestrates GDELT + GDACS for real-time
maritime risk intelligence, with static zones as a guaranteed fallback.

Architecture
────────────
1. **GDELT DOC 2.0** — real-time global news (free, no key, 15-min updates).
   Queries for war-risk, piracy, and geopolitical keywords per region.
2. **GDACS** — UN/EU Global Disaster Alerting Coordination System (free,
   no key).  Provides earthquake, cyclone, flood, and volcano alerts
   filtered to maritime-relevant regions.
3. **Static fallback** — four hardcoded risk zones that are always returned
   so the calendar never appears empty even if both APIs fail.

Caching
───────
GDELT results are cached for **6 hours** and GDACS for **12 hours**
using the ``provider_cache`` table, to stay well within rate limits.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.providers import gdacs_provider, gdelt_provider
from app.providers.cache import get_cached, set_cached

logger = logging.getLogger(__name__)

# ── Static risk-zone definitions (guaranteed fallback) ──────────────────────
RISK_ZONES: list[dict] = [
    {
        "id": "rz-1",
        "name": "Red Sea / Gulf of Aden",
        "type": "war_risk",
        "region": "Middle East",
        "severity": "Critical",
        "description": "Active Houthi attacks on commercial vessels. All transits require enhanced security measures.",
        "active": True,
    },
    {
        "id": "rz-2",
        "name": "Gulf of Guinea",
        "type": "piracy",
        "region": "West Africa",
        "severity": "High",
        "description": "Piracy and armed robbery incidents. Vessels should maintain heightened vigilance.",
        "active": True,
    },
    {
        "id": "rz-3",
        "name": "Black Sea — Western",
        "type": "war_risk",
        "region": "Eastern Europe",
        "severity": "Critical",
        "description": "Active conflict zone with mine risk. Commercial navigation highly restricted.",
        "active": True,
    },
    {
        "id": "rz-4",
        "name": "Strait of Hormuz",
        "type": "restricted",
        "region": "Middle East",
        "severity": "High",
        "description": "Geopolitical tensions and vessel seizure risk. War-risk insurance required.",
        "active": True,
    },
]


def _static_fallback_events() -> list[dict]:
    """Convert static risk zones into calendar events (always available)."""
    today = datetime.now().strftime("%Y-%m-%d")
    six_months = (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")

    events: list[dict] = []
    for zone in RISK_ZONES:
        if not zone.get("active", False):
            continue
        events.append(
            {
                "id": zone["id"],
                "type": "war_risk",
                "title": f"{zone['name']} — Risk Advisory",
                "description": zone["description"],
                "detail": (
                    f"{zone['name']} is classified as a {zone['type'].replace('_', ' ')} zone. "
                    f"{zone['description']} "
                    f"Consult your P&I club for latest war-risk insurance requirements."
                ),
                "port_id": None,
                "region": zone["region"],
                "start_date": today,
                "end_date": six_months,
                "severity": zone["severity"],
            }
        )
    return events


async def fetch_events(db: AsyncSession | None = None) -> list[dict]:
    """Fetch risk events from GDELT + GDACS, with caching and fallback.

    Parameters
    ----------
    db : AsyncSession, optional
        If provided, results are cached in ``provider_cache``.
        If ``None``, caching is skipped (useful for tests).

    Returns
    -------
    list[dict]
        Combined list of risk events from all sources.  Static fallback
        zones are **always** included so the calendar is never empty.
    """
    all_events: list[dict] = []

    # ── 1. Always include the static fallback zones ─────────────────────
    all_events.extend(_static_fallback_events())
    logger.info("Risk provider: %d static fallback events added", len(all_events))

    # ── 2. GDELT — real-time news intelligence (6 h cache) ──────────────
    gdelt_events = None
    if db is not None:
        gdelt_events = await get_cached(db, provider="gdelt", key="risk_articles")

    if gdelt_events is None:
        try:
            gdelt_events = await gdelt_provider.fetch_events()
            if db is not None and gdelt_events:
                await set_cached(
                    db,
                    provider="gdelt",
                    key="risk_articles",
                    payload=gdelt_events,
                    ttl_hours=6,
                )
        except Exception as exc:
            logger.error("GDELT provider failed: %s", exc)
            gdelt_events = []

    all_events.extend(gdelt_events or [])
    logger.info("Risk provider: %d GDELT events", len(gdelt_events or []))

    # ── 3. GDACS — UN/EU disaster alerts (12 h cache) ───────────────────
    gdacs_events = None
    if db is not None:
        gdacs_events = await get_cached(db, provider="gdacs", key="disaster_alerts")

    if gdacs_events is None:
        try:
            gdacs_events = await gdacs_provider.fetch_events()
            if db is not None and gdacs_events:
                await set_cached(
                    db,
                    provider="gdacs",
                    key="disaster_alerts",
                    payload=gdacs_events,
                    ttl_hours=12,
                )
        except Exception as exc:
            logger.error("GDACS provider failed: %s", exc)
            gdacs_events = []

    all_events.extend(gdacs_events or [])
    logger.info("Risk provider: %d GDACS events", len(gdacs_events or []))

    logger.info("Risk provider: %d total risk events", len(all_events))
    return all_events


def get_risk_zones() -> list[dict]:
    """Return the raw risk-zone list (synchronous, used by the risks tab)."""
    return [z for z in RISK_ZONES if z.get("active", False)]
