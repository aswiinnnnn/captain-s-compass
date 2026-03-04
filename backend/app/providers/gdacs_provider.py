"""GDACS provider — UN/EU Global Disaster Alerting Coordination System.

API docs : https://www.gdacs.org/gdacsapi/
Cost     : 100 %% free, no API key required.
Updates  : Near real-time (event-driven).

Queries GDACS for recent disasters (earthquakes, tropical cyclones, floods,
volcanoes, droughts, wildfires) and converts events near major shipping
lanes / ports into ``CalendarEvent``-shaped dicts.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

# GDACS event list endpoint (GeoJSON)
BASE_URL = (
    "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"
)

# ── Maritime-relevant bounding boxes ────────────────────────────────────────
# We only keep GDACS events whose coordinates fall within one of these
# regions, so the Risk Calendar stays focused on shipping-relevant hazards.
MARITIME_REGIONS: list[dict] = [
    {
        "name": "Red Sea / Gulf of Aden",
        "bbox": (30.0, 10.0, 50.0, 30.0),  # (lon_min, lat_min, lon_max, lat_max)
        "region": "Middle East",
    },
    {
        "name": "Strait of Hormuz / Persian Gulf",
        "bbox": (48.0, 22.0, 60.0, 30.0),
        "region": "Middle East",
    },
    {
        "name": "Bay of Bengal / Indian Ocean",
        "bbox": (60.0, 0.0, 100.0, 25.0),
        "region": "Asia - South",
    },
    {
        "name": "South China Sea / Strait of Malacca",
        "bbox": (95.0, -10.0, 125.0, 25.0),
        "region": "Asia - Southeast",
    },
    {
        "name": "Gulf of Guinea / West Africa",
        "bbox": (-20.0, -10.0, 15.0, 15.0),
        "region": "West Africa",
    },
    {
        "name": "Mediterranean Sea",
        "bbox": (-6.0, 30.0, 36.0, 46.0),
        "region": "Europe - South",
    },
    {
        "name": "Caribbean / Gulf of Mexico",
        "bbox": (-100.0, 10.0, -60.0, 35.0),
        "region": "Americas - North",
    },
    {
        "name": "East Asia / Pacific",
        "bbox": (120.0, 15.0, 160.0, 45.0),
        "region": "Asia - East",
    },
    {
        "name": "Black Sea",
        "bbox": (27.0, 40.0, 42.0, 47.0),
        "region": "Eastern Europe",
    },
    {
        "name": "North Sea / English Channel",
        "bbox": (-5.0, 48.0, 10.0, 62.0),
        "region": "Europe - North",
    },
]

# Map GDACS event types to our risk calendar types
EVENT_TYPE_MAP: dict[str, str] = {
    "EQ": "war_risk",   # Earthquakes → mapped to risk (port/infra damage)
    "TC": "weather",    # Tropical Cyclones → weather
    "FL": "weather",    # Floods → weather
    "VO": "war_risk",   # Volcanoes → risk (ash, port closures)
    "DR": "weather",    # Drought → weather (canal water levels)
    "WF": "war_risk",   # Wildfire → risk (port closures)
}

# Map GDACS alert levels to our severity
ALERT_SEVERITY_MAP: dict[str, str] = {
    "Red": "Critical",
    "Orange": "High",
    "Green": "Moderate",
}


def _in_bbox(lon: float, lat: float, bbox: tuple) -> bool:
    """Check if a point falls within a bounding box."""
    lon_min, lat_min, lon_max, lat_max = bbox
    return lon_min <= lon <= lon_max and lat_min <= lat <= lat_max


def _find_maritime_region(lon: float, lat: float) -> dict | None:
    """Return the first matching maritime region for a coordinate, or None."""
    for region in MARITIME_REGIONS:
        if _in_bbox(lon, lat, region["bbox"]):
            return region
    return None


async def fetch_events() -> list[dict]:
    """Query GDACS for recent disasters and return maritime-relevant events.

    Returns a list of dicts with **snake_case** keys matching the
    ``CalendarEvent`` ORM columns.
    """
    # Look back 30 days and forward to today
    today = datetime.now()
    from_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    to_date = today.strftime("%Y-%m-%d")
    validity_end = (today + timedelta(days=7)).strftime("%Y-%m-%d")

    events: list[dict] = []
    seen_ids: set[str] = set()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                BASE_URL,
                params={
                    "eventlist": "EQ,TC,FL,VO,DR,WF",
                    "fromDate": from_date,
                    "toDate": to_date,
                    "alertlevel": "Green;Orange;Red",
                },
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("GDACS API request failed: %s", exc)
        return []

    features = data.get("features", [])
    logger.info("GDACS returned %d total disaster events", len(features))

    for feature in features:
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        coords = geom.get("coordinates", [])

        if len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]

        # Filter: only keep events near maritime regions
        maritime_region = _find_maritime_region(lon, lat)
        if maritime_region is None:
            continue

        event_type_raw = props.get("eventtype", "")
        event_id = f"gdacs-{event_type_raw}-{props.get('eventid', '')}"

        if event_id in seen_ids:
            continue
        seen_ids.add(event_id)

        alert_level = props.get("alertlevel", "Green")
        severity = ALERT_SEVERITY_MAP.get(alert_level, "Moderate")
        calendar_type = EVENT_TYPE_MAP.get(event_type_raw, "war_risk")

        title = props.get("name", "Unknown event")
        description = props.get("description", title)
        html_desc = props.get("htmldescription", "")
        country = props.get("country", "Unknown")

        # Parse dates
        from_date_str = props.get("fromdate", "")
        to_date_str = props.get("todate", "")
        try:
            start_date = datetime.fromisoformat(from_date_str).strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            start_date = today.strftime("%Y-%m-%d")
        try:
            end_date = datetime.fromisoformat(to_date_str).strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            end_date = validity_end

        # Severity data
        severity_data = props.get("severitydata", {})
        severity_text = severity_data.get("severitytext", "")

        # Build detail
        report_url = ""
        url_info = props.get("url", {})
        if isinstance(url_info, dict):
            report_url = url_info.get("report", "")

        detail = (
            f"GDACS Alert Level: {alert_level}\n"
            f"Location: {country} ({lat:.2f}°N, {lon:.2f}°E)\n"
            f"Maritime Region: {maritime_region['name']}\n"
            f"Severity: {severity_text}\n"
            f"\n{html_desc}"
        )
        if report_url:
            detail += f"\n\nFull report: {report_url}"

        events.append(
            {
                "id": event_id,
                "type": calendar_type,
                "title": f"[{alert_level.upper()}] {title}"[:200],
                "description": f"GDACS disaster alert — {maritime_region['name']}"[:500],
                "detail": detail,
                "port_id": None,
                "region": maritime_region["region"],
                "start_date": start_date,
                "end_date": end_date,
                "severity": severity,
            }
        )

    logger.info(
        "GDACS provider: %d maritime-relevant events (from %d total)",
        len(events),
        len(features),
    )
    return events
