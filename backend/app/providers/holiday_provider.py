"""Holiday provider — public holidays via Nager.Date API.

API docs : https://date.nager.at/swagger/index.html
Cost     : Free, no API key required.
Rate-limit: Generous (100 req/min).
"""

from __future__ import annotations

import logging
from datetime import date, datetime

import httpx

logger = logging.getLogger(__name__)

# Map each tracked port to its ISO-3166 country code + metadata.
PORT_COUNTRY_MAP: dict[str, dict] = {
    # ── Europe ───────────────────────────────────────────────────────────────
    "rotterdam":  {"code": "NL", "region": "Europe - North",   "name": "Rotterdam"},
    "hamburg":    {"code": "DE", "region": "Europe - North",   "name": "Hamburg"},
    "antwerp":    {"code": "BE", "region": "Europe - North",   "name": "Antwerp"},
    "felixstowe": {"code": "GB", "region": "Europe - North",   "name": "Felixstowe"},
    "piraeus":    {"code": "GR", "region": "Europe - South",   "name": "Piraeus"},
    # ── Asia ─────────────────────────────────────────────────────────────────
    "singapore":  {"code": "SG", "region": "Asia - Southeast", "name": "Singapore"},
    "klang":      {"code": "MY", "region": "Asia - Southeast", "name": "Port Klang"},
    "colombo":    {"code": "LK", "region": "Asia - South",     "name": "Colombo"},
    "mumbai":     {"code": "IN", "region": "Asia - South",     "name": "Mumbai"},
    "shanghai":   {"code": "CN", "region": "Asia - East",      "name": "Shanghai"},
    "hongkong":   {"code": "HK", "region": "Asia - East",      "name": "Hong Kong"},
    "busan":      {"code": "KR", "region": "Asia - East",      "name": "Busan"},
    # ── Middle East & Africa ─────────────────────────────────────────────────
    "dubai":      {"code": "AE", "region": "Middle East",      "name": "Dubai / Jebel Ali"},
    "suez":       {"code": "EG", "region": "Middle East",      "name": "Port Said / Suez"},
    "durban":     {"code": "ZA", "region": "Africa - South",   "name": "Durban"},
    # ── Americas ─────────────────────────────────────────────────────────────
    "newyork":    {"code": "US", "region": "Americas - North", "name": "New York"},
    "losangeles": {"code": "US", "region": "Americas - North", "name": "Los Angeles"},
    "santos":     {"code": "BR", "region": "Americas - South", "name": "Santos"},
}

BASE_URL = "https://date.nager.at/api/v3/PublicHolidays"


async def fetch_events(year: int | None = None) -> list[dict]:
    """Fetch public holidays for every tracked-port country.

    Fetches the **current year and the next year** so upcoming holidays are
    always visible.  Holidays that have already passed (start_date < today)
    are silently skipped — the calendar only shows present and future events.

    Returns a list of dicts with **snake_case** keys matching the
    ``CalendarEvent`` ORM columns.
    """
    today = date.today()
    if year is None:
        year = today.year
    years_to_fetch = [year, year + 1]

    events: list[dict] = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for fetch_year in years_to_fetch:
            for port_id, info in PORT_COUNTRY_MAP.items():
                try:
                    resp = await client.get(f"{BASE_URL}/{fetch_year}/{info['code']}")
                    resp.raise_for_status()
                    holidays = resp.json()
                except (httpx.HTTPError, Exception) as exc:
                    logger.warning("Holiday fetch failed for %s/%s: %s", fetch_year, info["code"], exc)
                    continue

                for h in holidays:
                    # Skip holidays already in the past
                    if h["date"] < today.isoformat():
                        continue

                    # "global" holidays (nationwide) → Moderate; local/regional → Low
                    severity = "Moderate" if h.get("global", False) else "Low"
                    name = h.get("localName") or h.get("name", "Public Holiday")
                    intl_name = h.get("name", name)

                    event_id = f"hol-{port_id}-{h['date']}"
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

    logger.info("Holiday provider: fetched %d future events across %d countries", len(events), len(PORT_COUNTRY_MAP))
    return events
