"""Map Weather Provider — global grid weather for map overlays.

Fetches current weather (wind speed, wind direction, temperature,
precipitation) across a ~500-point grid covering the entire world.
Used for rendering wind arrows and weather overlays on the
frontend map.

API:   Open-Meteo Forecast (free, no key)
Cache: 6 hours (requests-cache on disk)
Grid:  ~500 points, 20 lat x 25 lng steps
SDK:   openmeteo-requests (supports multi-coordinate batch calls)

NOTE: This is separate from:
  - weather_provider.py  → 7-day severe-weather calendar alerts
"""

from __future__ import annotations

import logging
from pathlib import Path

import openmeteo_requests
import requests_cache
from retry_requests import retry

logger = logging.getLogger(__name__)

API_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_DIR = Path(".cache/map_weather_grid")
CACHE_SECONDS = 6 * 60 * 60  # 6 hours
BATCH_SIZE = 100  # max coords per API call (safe limit)


# ─── Grid Generation ──────────────────────────────────────────────


def _generate_ocean_grid() -> list[dict]:
    """Generate ~500 points covering the entire world.

    Grid:  lat -80 to +80  (step 8.42°)  → 20 rows
           lng -180 to +180 (step 14.4°)  → 25 columns + wrap
    Total: 20 × 25 = 500 points

    Covers everything from Arctic to Antarctic:
      - Full Russia, Scandinavia, Canada (high latitudes)
      - All shipping lanes, all oceans
      - Southern Ocean, near-Antarctic waters
    Open-Meteo supports up to ±90° but data quality degrades
    past ±80°, so we cap there.
    """
    points: list[dict] = []
    lat_start, lat_end = -80.0, 80.0
    lng_start, lng_end = -180.0, 165.6   # 25 steps of 14.4° from -180

    num_lat = 20
    num_lng = 25
    lat_step = (lat_end - lat_start) / (num_lat - 1)
    lng_step = (lng_end - lng_start) / (num_lng - 1)

    for i in range(num_lat):
        lat = lat_start + i * lat_step
        for j in range(num_lng):
            lng = lng_start + j * lng_step
            points.append({"lat": round(lat, 2), "lng": round(lng, 2)})

    return points


# Pre-compute the grid (it never changes)
GRID_POINTS = _generate_ocean_grid()


# ─── Client Factory ───────────────────────────────────────────────


def _create_client() -> openmeteo_requests.Client:
    """Open-Meteo client with 6-hour disk cache and retry."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_session = requests_cache.CachedSession(
        str(CACHE_DIR / "cache"),
        expire_after=CACHE_SECONDS,
    )
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    return openmeteo_requests.Client(session=retry_session)


# ─── Core Fetch ───────────────────────────────────────────────────


def fetch_grid_weather() -> list[dict]:
    """Fetch current weather for the entire global grid.

    Returns a list of ~500 dicts, each containing:
      - lat, lng             (grid coordinates)
      - wind_speed_kmh       (for arrow length)
      - wind_direction_deg   (for arrow rotation)
      - temperature_c        (for color coding)
      - precipitation_mm     (for rain overlay)

    Data is cached on disk for 6 hours.
    """
    client = _create_client()
    results: list[dict] = []

    # Batch the grid into chunks of BATCH_SIZE
    for i in range(0, len(GRID_POINTS), BATCH_SIZE):
        batch = GRID_POINTS[i : i + BATCH_SIZE]
        lats = [p["lat"] for p in batch]
        lngs = [p["lng"] for p in batch]

        try:
            responses = client.weather_api(
                API_URL,
                params={
                    "latitude": lats,
                    "longitude": lngs,
                    "current": [
                        "temperature_2m",
                        "precipitation",
                        "wind_speed_10m",
                        "wind_direction_10m",
                    ],
                },
            )

            for j, response in enumerate(responses):
                current = response.Current()
                temperature = current.Variables(0).Value()
                precipitation = current.Variables(1).Value()
                wind_speed = current.Variables(2).Value()
                wind_direction = current.Variables(3).Value()

                results.append({
                    "lat": batch[j]["lat"],
                    "lng": batch[j]["lng"],
                    "wind_speed_kmh": round(wind_speed, 1),
                    "wind_direction_deg": round(wind_direction, 0),
                    "temperature_c": round(temperature, 1),
                    "precipitation_mm": round(precipitation, 2),
                })

        except Exception as exc:
            logger.warning(
                "Map weather grid fetch failed for batch %d-%d: %s",
                i, i + len(batch), exc,
            )
            # Fill failed batch with None markers so the frontend
            # knows these points had errors
            for pt in batch:
                results.append({
                    "lat": pt["lat"],
                    "lng": pt["lng"],
                    "error": str(exc),
                })

    logger.info(
        "Map weather grid: fetched %d/%d points (cached for %dh)",
        sum(1 for r in results if "error" not in r),
        len(GRID_POINTS),
        CACHE_SECONDS // 3600,
    )
    return results


# ─── Per-Port Weather (kept for tooltips) ─────────────────────────

PORT_COORDS: dict[str, dict] = {
    "rotterdam": {"lat": 51.90, "lng": 4.50, "name": "Rotterdam", "country": "NL"},
    "hamburg": {"lat": 53.55, "lng": 9.99, "name": "Hamburg", "country": "DE"},
    "singapore": {"lat": 1.26, "lng": 103.84, "name": "Singapore", "country": "SG"},
    "shanghai": {"lat": 31.23, "lng": 121.47, "name": "Shanghai", "country": "CN"},
    "mumbai": {"lat": 18.95, "lng": 72.95, "name": "Mumbai", "country": "IN"},
    "newyork": {"lat": 40.68, "lng": -74.04, "name": "New York", "country": "US"},
    "santos": {"lat": -23.96, "lng": -46.30, "name": "Santos", "country": "BR"},
    "busan": {"lat": 35.10, "lng": 129.04, "name": "Busan", "country": "KR"},
}


def fetch_all_ports() -> list[dict]:
    """Fetch current weather for all tracked ports."""
    client = _create_client()
    results: list[dict] = []

    for port_id, info in PORT_COORDS.items():
        try:
            responses = client.weather_api(
                API_URL,
                params={
                    "latitude": info["lat"],
                    "longitude": info["lng"],
                    "current": ["temperature_2m", "precipitation", "wind_speed_10m"],
                },
            )
            response = responses[0]
            current = response.Current()

            results.append({
                "port_id": port_id,
                "port_name": info["name"],
                "country": info["country"],
                "lat": info["lat"],
                "lng": info["lng"],
                "current": {
                    "temperature_c": round(current.Variables(0).Value(), 1),
                    "precipitation_mm": round(current.Variables(1).Value(), 2),
                    "wind_speed_kmh": round(current.Variables(2).Value(), 1),
                },
            })
        except Exception as exc:
            logger.warning("Port weather fetch failed for %s: %s", port_id, exc)
            results.append({
                "port_id": port_id,
                "port_name": info["name"],
                "error": str(exc),
            })

    return results


def fetch_single_port(port_id: str) -> dict | None:
    """Fetch current weather for a single port by ID."""
    info = PORT_COORDS.get(port_id)
    if not info:
        return None

    client = _create_client()
    responses = client.weather_api(
        API_URL,
        params={
            "latitude": info["lat"],
            "longitude": info["lng"],
            "current": ["temperature_2m", "precipitation", "wind_speed_10m"],
        },
    )
    response = responses[0]
    current = response.Current()

    return {
        "port_id": port_id,
        "port_name": info["name"],
        "country": info["country"],
        "lat": info["lat"],
        "lng": info["lng"],
        "current": {
            "temperature_c": round(current.Variables(0).Value(), 1),
            "precipitation_mm": round(current.Variables(1).Value(), 2),
            "wind_speed_kmh": round(current.Variables(2).Value(), 1),
        },
    }
