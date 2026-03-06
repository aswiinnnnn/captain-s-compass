"""Risk-zone provider — orchestrates Tavily for real-time maritime risk
intelligence.

Architecture
────────────
1. **Tavily Search API** — news-focused search engine optimised for AI
   applications (https://tavily.com).  Fires one query per maritime
   chokepoint / threat category; results are mapped to CalendarEvent-shaped
   dicts.  Requires ``TAVILY_API_KEY`` in ``.env`` (free tier: 1 000
   credits/month).
"""

from __future__ import annotations

import logging

from app.providers import tavily_provider

logger = logging.getLogger(__name__)


async def fetch_events() -> list[dict]:
    """Fetch risk events from the Tavily news provider.

    Returns
    -------
    list[dict]
        Risk events ready for ``calendar_crud.upsert_event``.
    """
    try:
        events = await tavily_provider.fetch_events()
        logger.info("Risk provider: %d Tavily events", events)
        return events
    except Exception as exc:
        logger.error("Tavily provider failed: %s", exc)
        return []
