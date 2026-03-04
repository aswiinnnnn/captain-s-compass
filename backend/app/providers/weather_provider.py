"""Weather provider — 7-day marine weather alerts via Open-Meteo API.

API docs : https://open-meteo.com/en/docs
Cost     : Free, no API key required.
Rate-limit: 10 000 req/day (non-commercial).

The provider queries each tracked port's coordinates, inspects WMO weather
codes and maximum wind speeds, and emits ``CalendarEvent``-shaped dicts for
days with severe conditions.  Consecutive severe days are merged into a
single event.
"""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

# Port coordinates (lat / lng) + metadata.
PORT_COORDS: dict[str, dict] = {
    "rotterdam": {"lat": 51.90, "lng": 4.50, "region": "Europe - North", "name": "Rotterdam"},
    "hamburg": {"lat": 53.55, "lng": 9.99, "region": "Europe - North", "name": "Hamburg"},
    "singapore": {"lat": 1.26, "lng": 103.84, "region": "Asia - Southeast", "name": "Singapore"},
    "shanghai": {"lat": 31.23, "lng": 121.47, "region": "Asia - East", "name": "Shanghai"},
    "mumbai": {"lat": 18.95, "lng": 72.95, "region": "Asia - South", "name": "Mumbai"},
    "newyork": {"lat": 40.68, "lng": -74.04, "region": "Americas - North", "name": "New York"},
    "santos": {"lat": -23.96, "lng": -46.30, "region": "Americas - South", "name": "Santos"},
    "busan": {"lat": 35.10, "lng": 129.04, "region": "Asia - East", "name": "Busan"},
}

BASE_URL = "https://api.open-meteo.com/v1/forecast"

# WMO codes that signal operationally-relevant weather.
SEVERE_CODES: dict[int, str] = {
    55: "Dense drizzle",
    57: "Dense freezing drizzle",
    65: "Heavy rain",
    67: "Heavy freezing rain",
    75: "Heavy snowfall",
    77: "Snow grains",
    82: "Violent rain showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _severity_rank(severity: str) -> int:
    return {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}.get(severity, 0)


def _classify_severity(wind_speed_max: float, weather_code: int) -> str | None:
    """Return a severity string if weather is operationally severe, else ``None``."""
    if wind_speed_max >= 90 or weather_code in (95, 96, 99):
        return "Critical"
    if wind_speed_max >= 62 or weather_code in (82, 86):
        return "High"
    if wind_speed_max >= 40 or weather_code in SEVERE_CODES:
        return "Moderate"
    return None  # below threshold — not reported


def _weather_title(weather_code: int, port_name: str) -> str:
    desc = SEVERE_CODES.get(weather_code, "Severe Weather")
    return f"{desc} — {port_name}"


async def fetch_events() -> list[dict]:
    """Return severe-weather calendar events for the next 7 days."""
    events: list[dict] = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for port_id, info in PORT_COORDS.items():
            try:
                resp = await client.get(
                    BASE_URL,
                    params={
                        "latitude": info["lat"],
                        "longitude": info["lng"],
                        "daily": "weather_code,wind_speed_10m_max",
                        "timezone": "auto",
                        "forecast_days": 7,
                    },
                )
                resp.raise_for_status()
                daily = resp.json().get("daily", {})
            except (httpx.HTTPError, Exception) as exc:
                logger.warning("Weather fetch failed for %s: %s", port_id, exc)
                continue

            dates = daily.get("time", [])
            codes = daily.get("weather_code", [])
            winds = daily.get("wind_speed_10m_max", [])

            # Merge consecutive severe days into single events.
            i = 0
            while i < len(dates):
                code = codes[i] if i < len(codes) else 0
                wind = winds[i] if i < len(winds) else 0.0
                severity = _classify_severity(wind, code)

                if severity is None:
                    i += 1
                    continue

                start_date = dates[i]
                end_date = dates[i]
                peak_wind = wind
                peak_code = code

                # Extend window over consecutive severe days.
                j = i + 1
                while j < len(dates):
                    c2 = codes[j] if j < len(codes) else 0
                    w2 = winds[j] if j < len(winds) else 0.0
                    s2 = _classify_severity(w2, c2)
                    if s2 is None:
                        break
                    end_date = dates[j]
                    if _severity_rank(s2) > _severity_rank(severity):
                        severity = s2
                    if w2 > peak_wind:
                        peak_wind = w2
                        peak_code = c2
                    j += 1

                event_id = f"wx-{port_id}-{start_date}"
                events.append(
                    {
                        "id": event_id,
                        "type": "weather",
                        "title": _weather_title(peak_code, info["name"]),
                        "description": (
                            f"Severe weather expected at {info['name']} "
                            f"with winds up to {peak_wind:.0f} km/h."
                        ),
                        "detail": (
                            f"Forecast indicates WMO code {peak_code} "
                            f"({SEVERE_CODES.get(peak_code, 'Adverse conditions')}) "
                            f"with maximum wind speeds of {peak_wind:.0f} km/h. "
                            f"Port operations may be affected from {start_date} to {end_date}."
                        ),
                        "port_id": port_id,
                        "region": info["region"],
                        "start_date": start_date,
                        "end_date": end_date,
                        "severity": severity,
                    }
                )
                i = j  # skip past the merged window

    logger.info("Weather provider: fetched %d alerts across %d ports", len(events), len(PORT_COORDS))
    return events
