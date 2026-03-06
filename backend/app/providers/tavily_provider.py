"""Maritime risk-news provider — real-time intelligence via Tavily Search API.

API docs  : https://docs.tavily.com/docs/python-sdk/tavily-search/api-reference
Cost      : Free tier — 1 000 API credits/month (each search = 1 credit).
Auth      : Bearer token — set ``TAVILY_API_KEY`` in ``.env``.
Rate-limit: ~10 req/s on free tier; we use a 0.5 s pause between queries.

Architecture
────────────
The provider fires one Tavily *news* search per ``MARITIME_RISK_QUERIES``
entry, collects results from the last 30 days, and maps every article to a
``CalendarEvent``-shaped dict.  Multiple articles from the same query are
de-duplicated by URL.

Each query entry carries:
``query``    — Tavily search string.
``port_id``  — Calendar port the event is pinned to.
``region``   — Human-readable region label.
``severity`` — Default severity ("low" | "medium" | "high").  Individual
               results can be bumped to "high" if Tavily's relevance score
               is ≥ 0.85.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TAVILY_URL = "https://api.tavily.com/search"
_MAX_RESULTS_PER_QUERY = 5
_NEWS_LOOKBACK_DAYS = 7   # only the freshest news — anything older is already in the DB
_PAUSE_BETWEEN_QUERIES = 0.5  # seconds — stay well within rate limits

# ── Maritime risk queries ──────────────────────────────────────────────────────
# Each entry maps to a port so calendar events land on the right schedule.
MARITIME_RISK_QUERIES: list[dict[str, Any]] = [
    {
        "query": "Red Sea Houthi attack shipping vessel 2025 2026",
        "port_id": "singapore",   # high-traffic re-route hub
        "region": "Red Sea / Gulf of Aden",
        "severity": "high",
    },
    {
        "query": "Black Sea shipping war risk Ukraine Russia vessels",
        "port_id": "rotterdam",
        "region": "Black Sea",
        "severity": "high",
    },
    {
        "query": "Strait of Hormuz Iran shipping disruption sanctions",
        "port_id": "mumbai",
        "region": "Strait of Hormuz",
        "severity": "medium",
    },
    {
        "query": "Strait of Malacca piracy maritime security incident",
        "port_id": "singapore",
        "region": "Strait of Malacca",
        "severity": "medium",
    },
    {
        "query": "Gulf of Guinea piracy attack cargo vessel Nigeria",
        "port_id": "santos",
        "region": "Gulf of Guinea",
        "severity": "high",
    },
    {
        "query": "South China Sea maritime dispute shipping lane security",
        "port_id": "shanghai",
        "region": "South China Sea",
        "severity": "medium",
    },
    {
        "query": "port closure storm cyclone typhoon hurricane shipping delay",
        "port_id": "busan",
        "region": "Global — Weather",
        "severity": "medium",
    },
    {
        "query": "maritime sanctions violation cargo ship detained seized",
        "port_id": "hamburg",
        "region": "Global — Sanctions",
        "severity": "low",
    },
    # ── Disruptions — canal congestion, port delays ───────────────────────
    {
        "query": "Suez Canal vessel traffic delay congestion shipping backlog disruption",
        "port_id": "suez",
        "region": "Suez Canal",
        "severity": "high",
        "event_type": "disruption",
    },
    {
        "query": "Panama Canal drought low water level shipping delay queue vessels transit",
        "port_id": "losangeles",
        "region": "Panama Canal",
        "severity": "high",
        "event_type": "disruption",
    },
    {
        "query": "global port congestion container shipping delays backlog supply chain",
        "port_id": None,
        "region": "Global — Port Congestion",
        "severity": "medium",
        "event_type": "disruption",
    },
]


def _parse_published_date(raw: str | None) -> date:
    """Return a ``date`` from an ISO-8601 string, or today as fallback."""
    if not raw:
        return date.today()
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw[:19], fmt[:len(raw[:19])]).date()
        except ValueError:
            continue
    return date.today()


def _score_to_severity(score: float, default: str) -> str:
    """Bump severity to 'high' for very relevant results."""
    if score >= 0.85:
        return "high"
    if score >= 0.65:
        return "medium" if default != "high" else "high"
    return default


def _result_to_event(result: dict[str, Any], query_meta: dict[str, Any]) -> dict:
    """Map a single Tavily result to a CalendarEvent-shaped dict."""
    published = _parse_published_date(result.get("published_date"))
    score: float = float(result.get("score", 0.5))
    severity = _score_to_severity(score, query_meta["severity"])
    event_type = query_meta.get("event_type", "risk")

    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, result.get("url", str(uuid.uuid4())))),
        "type": event_type,
        "title": (result.get("title") or query_meta["region"])[:200],
        "description": f"Maritime {event_type} alert — {query_meta['region']}",
        "detail": (result.get("content") or "")[:1000],
        "port_id": query_meta.get("port_id"),
        "region": query_meta["region"],
        "start_date": published.isoformat(),
        "end_date": (published + timedelta(days=7)).isoformat(),
        "severity": severity,
    }


async def _search_once(
    client: httpx.AsyncClient,
    query_meta: dict[str, Any],
) -> list[dict]:
    """Execute a single Tavily news search and return event dicts."""
    if not settings.TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not set — skipping query: %s", query_meta["query"])
        return []

    payload = {
        "api_key": settings.TAVILY_API_KEY,
        "query": query_meta["query"],
        "search_depth": "basic",   # basic = 1 credit; advanced = 2 credits
        "topic": "news",
        "days": _NEWS_LOOKBACK_DAYS,
        "max_results": _MAX_RESULTS_PER_QUERY,
        "include_answer": False,
        "include_raw_content": False,
    }

    try:
        response = await client.post(_TAVILY_URL, json=payload, timeout=20.0)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Tavily HTTP error %s for query '%s': %s",
            exc.response.status_code,
            query_meta["query"],
            exc.response.text[:200],
        )
        return []
    except httpx.RequestError as exc:
        logger.error("Tavily request error for query '%s': %s", query_meta["query"], exc)
        return []

    data = response.json()
    results: list[dict] = data.get("results", [])
    events = [_result_to_event(r, query_meta) for r in results]
    logger.debug(
        "Tavily: %d results for '%s'", len(events), query_meta["query"][:60]
    )
    return events


async def fetch_events() -> list[dict]:
    """Run all maritime risk queries against Tavily and return event dicts.

    Queries are executed sequentially with a short pause to be polite to
    the rate limiter.  Results are de-duplicated by event ``id`` (URL-based
    UUID5), so the same article will not appear twice even if two queries
    match it.

    Returns
    -------
    list[dict]
        CalendarEvent-shaped dicts ready for ``calendar_crud.upsert_event``.
    """
    today = date.today().isoformat()
    seen_ids: set[str] = set()
    all_events: list[dict] = []

    async with httpx.AsyncClient() as client:
        for query_meta in MARITIME_RISK_QUERIES:
            events = await _search_once(client, query_meta)
            for event in events:
                # Skip events that have already ended
                if event["end_date"] < today:
                    continue
                if event["id"] not in seen_ids:
                    seen_ids.add(event["id"])
                    all_events.append(event)
            await asyncio.sleep(_PAUSE_BETWEEN_QUERIES)

    logger.info("Tavily provider: %d unique risk events fetched", len(all_events))
    return all_events
