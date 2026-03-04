"""GDELT DOC 2.0 provider — real-time maritime risk intelligence from global news.

API docs : https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
Cost     : 100 %% free, no API key required.
Updates  : Every 15 minutes.

Queries GDELT for war-risk, piracy, and geopolitical articles relevant to
maritime shipping lanes, then converts them into ``CalendarEvent``-shaped dicts.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

# ── Region-specific query configurations ────────────────────────────────────
# Each entry produces a separate GDELT query so that the resulting events
# can be tagged with a specific region and risk type.
RISK_QUERIES: list[dict] = [
    {
        "label": "Red Sea / Houthi Attacks",
        "query": (
            '("Houthi" OR "Red Sea attack" OR "Gulf of Aden")'
            " (shipping OR vessel OR maritime OR tanker)"
        ),
        "region": "Middle East",
        "risk_type": "war_risk",
        "default_severity": "Critical",
    },
    {
        "label": "Black Sea Conflict",
        "query": (
            '("Black Sea" OR "Ukraine" OR "naval mine")'
            " (shipping OR vessel OR maritime OR port)"
        ),
        "region": "Eastern Europe",
        "risk_type": "war_risk",
        "default_severity": "Critical",
    },
    {
        "label": "Gulf of Guinea Piracy",
        "query": (
            '("Gulf of Guinea" OR "Nigeria piracy" OR "West Africa piracy")'
            " (ship OR vessel OR maritime OR pirate)"
        ),
        "region": "West Africa",
        "risk_type": "piracy",
        "default_severity": "High",
    },
    {
        "label": "Strait of Hormuz Tensions",
        "query": (
            '("Strait of Hormuz" OR "Iran seizure" OR "Persian Gulf")'
            " (tanker OR vessel OR shipping OR maritime)"
        ),
        "region": "Middle East",
        "risk_type": "war_risk",
        "default_severity": "High",
    },
    {
        "label": "Strait of Malacca Piracy",
        "query": (
            '("Strait of Malacca" OR "Singapore Strait" OR "Southeast Asia piracy")'
            " (ship OR vessel OR piracy)"
        ),
        "region": "Asia - Southeast",
        "risk_type": "piracy",
        "default_severity": "Moderate",
    },
    {
        "label": "Global Maritime Attacks",
        "query": (
            '("maritime attack" OR "shipping attack" OR "vessel hijack"'
            ' OR "piracy incident") -(fishing)'
        ),
        "region": "Global",
        "risk_type": "war_risk",
        "default_severity": "High",
    },
]


def _severity_from_tone(tone: float, default: str) -> str:
    """Derive severity from GDELT's average tone score.

    GDELT tone ranges roughly from −25 (extremely negative) to +25.
    More negative tone → higher severity for risk events.
    """
    if tone <= -8:
        return "Critical"
    if tone <= -4:
        return "High"
    if tone <= -1:
        return "Moderate"
    # Mildly negative or neutral — use the query's default.
    return default


def _article_id(url: str) -> str:
    """Deterministic short id from an article URL."""
    return f"gdelt-{hashlib.md5(url.encode()).hexdigest()[:12]}"


async def fetch_events() -> list[dict]:
    """Query GDELT for each risk category and return calendar events.

    Returns a list of dicts with **snake_case** keys matching the
    ``CalendarEvent`` ORM columns.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    validity_end = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    events: list[dict] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=20.0) as client:
        for idx, rq in enumerate(RISK_QUERIES):
            # Throttle requests to avoid GDELT 429 rate limiting
            if idx > 0:
                await asyncio.sleep(1.5)
            try:
                resp = await client.get(
                    BASE_URL,
                    params={
                        "query": rq["query"],
                        "mode": "artlist",
                        "maxrecords": "30",
                        "format": "json",
                        "timespan": "1w",
                        "sort": "datedesc",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "GDELT query '%s' returned %s",
                    rq["label"],
                    exc.response.status_code,
                )
                continue
            except Exception as exc:
                logger.warning("GDELT query '%s' failed: %s", rq["label"], exc)
                continue

            articles = data.get("articles") or []
            for art in articles:
                url = art.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                title = art.get("title", "").strip()
                if not title:
                    continue

                # Parse tone (first value in the comma-separated tone string).
                tone_raw = art.get("tone", "0")
                try:
                    tone = float(str(tone_raw).split(",")[0])
                except (ValueError, IndexError):
                    tone = 0.0

                severity = _severity_from_tone(tone, rq["default_severity"])

                # Parse the article date.
                seen_date = art.get("seendate", "")
                try:
                    article_date = datetime.strptime(
                        seen_date[:8], "%Y%m%d"
                    ).strftime("%Y-%m-%d")
                except (ValueError, IndexError):
                    article_date = today

                source = art.get("domain", "news source")

                events.append(
                    {
                        "id": _article_id(url),
                        "type": rq["risk_type"],
                        "title": title[:200],
                        "description": f"[{rq['label']}] Reported by {source}",
                        "detail": (
                            f"Source: {url}\n\n"
                            f"This article was flagged by GDELT real-time monitoring "
                            f"under the '{rq['label']}' risk category. "
                            f"Tone score: {tone:.1f} (negative = higher risk). "
                            f"Review the source for operational impact assessment."
                        ),
                        "port_id": None,
                        "region": rq["region"],
                        "start_date": article_date,
                        "end_date": validity_end,
                        "severity": severity,
                    }
                )

    logger.info(
        "GDELT provider: fetched %d risk articles across %d queries",
        len(events),
        len(RISK_QUERIES),
    )
    return events
