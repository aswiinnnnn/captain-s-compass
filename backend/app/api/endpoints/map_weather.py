"""Map weather grid endpoint — serves wind/temp/rain data for map overlays."""

from __future__ import annotations

import math

from fastapi import APIRouter

from app.providers.map_weather_provider import fetch_grid_weather

router = APIRouter(tags=["map-weather"])


def _speed_dir_to_uv(speed_kmh: float, direction_deg: float) -> tuple[float, float]:
    """Convert wind speed + meteorological direction to u/v vector components.

    Meteorological direction: where wind comes FROM (0=N, 90=E, 180=S, 270=W).
    u = east-west component (positive = westerly, blowing east)
    v = north-south component (positive = southerly, blowing north)
    """
    rad = math.radians(direction_deg)
    u = -speed_kmh * math.sin(rad)
    v = -speed_kmh * math.cos(rad)
    return round(u, 2), round(v, 2)


@router.get("/grid")
def get_grid_weather():
    """Return weather grid data formatted for map overlays.

    - wind: header + u/v arrays for leaflet-velocity
    - temperature: point array for heatmap overlay
    - precipitation: point array for rain overlay

    Data is cached on disk for 6 hours by the provider.
    """
    raw = fetch_grid_weather()

    # Separate successful points from errors
    points = [p for p in raw if "error" not in p]

    if not points:
        return {"wind": None, "temperature": [], "precipitation": []}

    # Build u/v arrays (leaflet-velocity expects data ordered lat-descending, lng-ascending)
    # Our grid is already ordered lat-ascending, lng-ascending — reverse lat order
    # Grid dimensions
    lngs = sorted(set(p["lng"] for p in points))
    lats = sorted(set(p["lat"] for p in points), reverse=True)  # descending for GRIB
    nx = len(lngs)
    ny = len(lats)

    # Index by (lat, lng) for fast lookup
    lookup = {(p["lat"], p["lng"]): p for p in points}

    u_data = []
    v_data = []
    for lat in lats:
        for lng in lngs:
            p = lookup.get((lat, lng))
            if p:
                u, v = _speed_dir_to_uv(p["wind_speed_kmh"], p["wind_direction_deg"])
                u_data.append(u)
                v_data.append(v)
            else:
                u_data.append(0)
                v_data.append(0)

    # GRIB2-like header for leaflet-velocity
    dx = round(lngs[1] - lngs[0], 3) if len(lngs) > 1 else 18.0
    dy = round(lats[0] - lats[1], 3) if len(lats) > 1 else 8.667  # descending

    wind_header = {
        "parameterCategory": 2,
        "parameterNumber": 2,
        "lo1": lngs[0],
        "lo2": lngs[-1],
        "la1": lats[0],   # highest lat first (descending)
        "la2": lats[-1],
        "dx": dx,
        "dy": dy,
        "nx": nx,
        "ny": ny,
    }

    # Temperature + precipitation as simple point arrays
    temperature = [
        {"lat": p["lat"], "lng": p["lng"], "value": p["temperature_c"]}
        for p in points
    ]
    precipitation = [
        {"lat": p["lat"], "lng": p["lng"], "value": p["precipitation_mm"]}
        for p in points if p["precipitation_mm"] > 0
    ]

    return {
        "wind": [
            {"header": {**wind_header, "parameterNumber": 2}, "data": u_data},
            {"header": {**wind_header, "parameterNumber": 3}, "data": v_data},
        ],
        "temperature": temperature,
        "precipitation": precipitation,
    }
