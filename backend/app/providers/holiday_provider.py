"""Holiday provider — public holidays via Nager.Date API.

API docs : https://date.nager.at/swagger/index.html
Cost     : Free, no API key required.
Rate-limit: Generous (100 req/min).
"""

from __future__ import annotations

import logging
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

# Map each tracked port to its ISO-3166 country code + metadata.
PORT_COUNTRY_MAP: dict[str, dict] = {
    "rotterdam": {"code": "NL", "region": "Europe - North", "name": "Rotterdam"},
    "hamburg": {"code": "DE", "region": "Europe - North", "name": "Hamburg"},
    "singapore": {"code": "SG", "region": "Asia - Southeast", "name": "Singapore"},
    "shanghai": {"code": "CN", "region": "Asia - East", "name": "Shanghai"},
    "mumbai": {"code": "IN", "region": "Asia - South", "name": "Mumbai"},
    "newyork": {"code": "US", "region": "Americas - North", "name": "New York"},
    "santos": {"code": "BR", "region": "Americas - South", "name": "Santos"},
    "busan": {"code": "KR", "region": "Asia - East", "name": "Busan"},
}

BASE_URL = "https://date.nager.at/api/v3/PublicHolidays"


async def fetch_events(year: int | None = None) -> list[dict]:
    """Fetch public holidays for every tracked-port country.

    Returns a list of dicts with **snake_case** keys matching the
    ``CalendarEvent`` ORM columns.
    """
    if year is None:
        year = datetime.now().year

    events: list[dict] = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for port_id, info in PORT_COUNTRY_MAP.items():
            try:
                resp = await client.get(f"{BASE_URL}/{year}/{info['code']}")
                resp.raise_for_status()
                holidays = resp.json()
            except (httpx.HTTPError, Exception) as exc:
                logger.warning("Holiday fetch failed for %s: %s", info["code"], exc)
                continue

            for h in holidays:
                # Determine severity:
                # "global" holidays (nationwide) → Moderate; local/regional → Low
                severity = "Moderate" if h.get("global", False) else "Low"
                name = h.get("localName") or h.get("name", "Public Holiday")
                intl_name = h.get("name", name)

                event_id = f"hol-{info['code'].lower()}-{h['date']}"
                events.append(
                    {
                        "id": event_id,
                        "type": "holiday",
                        "title": name,
                        "description": f"Public holiday in {info['name']} ({intl_name})",
                        "detail": (
                            f"{intl_name} is a public holiday in {info['name']}. "
                            f"Port operations may be reduced or suspended for the day."
                        ),
                        "port_id": port_id,
                        "region": info["region"],
                        "start_date": h["date"],
                        "end_date": h["date"],
                        "severity": severity,
                    }
                )

    logger.info("Holiday provider: fetched %d events for %d countries", len(events), len(PORT_COUNTRY_MAP))
    return events
