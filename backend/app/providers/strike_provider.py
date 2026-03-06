"""Port strike & labour action provider — real-time intelligence via Tavily.

API docs  : https://docs.tavily.com/docs/python-sdk/tavily-search/api-reference
Cost      : Shares the same ``TAVILY_API_KEY`` credit pool as tavily_provider
            (free tier: 1 000 credits/month; each query = 1 credit).
Auth      : Bearer token — set ``TAVILY_API_KEY`` in ``.env``.

Queries for port strikes, dockworker disputes, transport-worker protests,
customs/border-agency actions, and trucking stoppages that disrupt port
throughput.  Events carry ``type = "strike"`` to distinguish them from
war-risk events and can be filtered independently on the frontend.

Strike events default to a 14-day window (shorter disputes resolve in days;
longer ones — like ILWU West Coast actions — can run for weeks).
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import date, datetime, timedelta
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TAVILY_URL = "https://api.tavily.com/search"
_MAX_RESULTS_PER_QUERY = 5
_NEWS_LOOKBACK_DAYS = 7   # only the freshest news — anything older is already in the DB
_PAUSE_BETWEEN_QUERIES = 0.5  # seconds

# ── Strike / labour-action queries ────────────────────────────────────────────
STRIKE_QUERIES: list[dict[str, Any]] = [
    # ── Americas ─────────────────────────────────────────────────────────────
    {
        "query": "US East Coast ILA dockworker port strike labor dispute shipping 2026",
        "port_id": "newyork",
        "region": "Americas - North",
        "severity": "high",
    },
    {
        "query": "US West Coast ILWU port strike Los Angeles Long Beach labor action",
        "port_id": "losangeles",
        "region": "Americas - North",
        "severity": "high",
    },
    {
        "query": "Brazil Santos port workers strike OGMO docker labor dispute cargo delay",
        "port_id": "santos",
        "region": "Americas - South",
        "severity": "medium",
    },
    # ── Europe ───────────────────────────────────────────────────────────────
    {
        "query": "European port strike Rotterdam Hamburg Antwerp Belgium dockworkers walkout",
        "port_id": "hamburg",
        "region": "Europe - North",
        "severity": "high",
    },
    {
        "query": "UK Felixstowe port worker strike walkout industrial action disruption",
        "port_id": "felixstowe",
        "region": "Europe - North",
        "severity": "medium",
    },
    {
        "query": "Greek port Piraeus Thessaloniki dock strike labor action shipping delay",
        "port_id": "piraeus",
        "region": "Europe - South",
        "severity": "medium",
    },
    # ── Middle East & Africa ─────────────────────────────────────────────────
    {
        "query": "South Africa Durban Transnet port strike workers freight disruption TNPA",
        "port_id": "durban",
        "region": "Africa - South",
        "severity": "medium",
    },
    # ── Asia & South Asia ────────────────────────────────────────────────────
    {
        "query": "India JNPT Mumbai port dock worker strike protest cargo delay MPSEU",
        "port_id": "mumbai",
        "region": "Asia - South",
        "severity": "medium",
    },
    {
        "query": "South Korea Busan port workers strike labor action KMU cargo delay",
        "port_id": "busan",
        "region": "Asia - East",
        "severity": "medium",
    },
    # ── Global / cross-regional ──────────────────────────────────────────────
    {
        "query": "truck driver strike logistics port access road freight delay",
        "port_id": None,  # global impact
        "region": "Global — Logistics",
        "severity": "low",
    },
    {
        "query": "customs officers border agency strike cargo clearance delay maritime port",
        "port_id": None,
        "region": "Global — Customs",
        "severity": "low",
    },
]


def _parse_published_date(raw: str | None) -> date:
    """Return a ``date`` from an ISO-8601 string, or today as fallback."""
    if not raw:
        return date.today()
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw[:19], fmt[: len(raw[:19])]).date()
        except ValueError:
            continue
    return date.today()


def _score_to_severity(score: float, default: str) -> str:
    """Bump severity to 'high' for highly relevant results."""
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

    return {
        # Prefix "str:" ensures UUID5 never collides with tavily_provider entries.
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"strike:{result.get('url', str(uuid.uuid4()))}")),
        "type": "strike",
        "title": (result.get("title") or f"Labour action — {query_meta['region']}")[:200],
        "description": f"Port strike / labour action — {query_meta['region']}",
        "detail": (result.get("content") or "")[:1000],
        "port_id": query_meta.get("port_id"),
        "region": query_meta["region"],
        "start_date": published.isoformat(),
        "end_date": (published + timedelta(days=14)).isoformat(),  # strikes can persist for weeks
        "severity": severity,
    }


async def _search_once(
    client: httpx.AsyncClient,
    query_meta: dict[str, Any],
) -> list[dict]:
    """Execute a single Tavily news search and return strike event dicts."""
    if not settings.TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not set — skipping strike query: %s", query_meta["query"])
        return []

    payload = {
        "api_key": settings.TAVILY_API_KEY,
        "query": query_meta["query"],
        "search_depth": "basic",
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
            "Tavily HTTP error %s for strike query '%s': %s",
            exc.response.status_code,
            query_meta["query"],
            exc.response.text[:200],
        )
        return []
    except httpx.RequestError as exc:
        logger.error("Tavily request error for strike query '%s': %s", query_meta["query"], exc)
        return []

    data = response.json()
    results: list[dict] = data.get("results", [])
    events = [_result_to_event(r, query_meta) for r in results]
    logger.debug("Tavily strike: %d results for '%s'", len(events), query_meta["query"][:60])
    return events


async def fetch_events() -> list[dict]:
    """Run all port-strike / labour-action queries and return event dicts.

    Queries are executed sequentially with a short pause.  Results are
    de-duplicated by URL-based UUID5 id (namespaced with ``strike:`` prefix).

    Returns
    -------
    list[dict]
        CalendarEvent-shaped dicts with ``type = "strike"`` ready for
        ``calendar_crud.upsert_event``.
    """
    today = date.today().isoformat()
    seen_ids: set[str] = set()
    all_events: list[dict] = []

    async with httpx.AsyncClient() as client:
        for query_meta in STRIKE_QUERIES:
            events = await _search_once(client, query_meta)
            for event in events:
                # Skip events that have already ended
                if event["end_date"] < today:
                    continue
                if event["id"] not in seen_ids:
                    seen_ids.add(event["id"])
                    all_events.append(event)
            await asyncio.sleep(_PAUSE_BETWEEN_QUERIES)

    logger.info("Strike provider: %d unique events fetched", len(all_events))
    return all_events
