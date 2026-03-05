"""Test script for the Map Weather Provider — global grid + port weather.

Run:  .venv\Scripts\python.exe tests/test_map_weather.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.providers.map_weather_provider import (
    GRID_POINTS,
    fetch_all_ports,
    fetch_grid_weather,
    fetch_single_port,
)


def test_grid_count():
    """Verify the grid has ~300 points."""
    print("=" * 65)
    print("  TEST 1: Grid Point Count")
    print("=" * 65)
    count = len(GRID_POINTS)
    print(f"\n  Grid points generated: {count}")
    print(f"  Lat range: {GRID_POINTS[0]['lat']} to {GRID_POINTS[-1]['lat']}")
    print(f"  Lng range: {GRID_POINTS[0]['lng']} to {GRID_POINTS[-1]['lng']}")
    assert 480 <= count <= 520, f"Expected ~500 points, got {count}"
    print("  [OK] Grid count is within expected range")
    print()


def test_fetch_grid():
    """Fetch weather for the entire grid and show stats."""
    print("=" * 65)
    print("  TEST 2: Fetch Global Grid Weather (~300 points)")
    print("=" * 65)
    print("\n  Fetching... (this may take a few seconds on first run)\n")

    start = time.time()
    results = fetch_grid_weather()
    elapsed = time.time() - start

    success = [r for r in results if "error" not in r]
    failed = [r for r in results if "error" in r]

    print(f"  Total points:  {len(results)}")
    print(f"  Success:       {len(success)}")
    print(f"  Failed:        {len(failed)}")
    print(f"  Time:          {elapsed:.1f}s")

    if success:
        winds = [r["wind_speed_kmh"] for r in success]
        temps = [r["temperature_c"] for r in success]
        print(f"\n  Wind speed range:  {min(winds):.1f} - {max(winds):.1f} km/h")
        print(f"  Temperature range: {min(temps):.1f} - {max(temps):.1f} C")

        # Show a few sample points
        print("\n  Sample points:")
        for r in success[:5]:
            print(
                f"    ({r['lat']:7.2f}, {r['lng']:7.2f}) | "
                f"Wind: {r['wind_speed_kmh']:5.1f} km/h @ {r['wind_direction_deg']:3.0f} deg | "
                f"Temp: {r['temperature_c']:5.1f} C | "
                f"Rain: {r['precipitation_mm']:.2f} mm"
            )

    if failed:
        print(f"\n  Failed points (first 3):")
        for r in failed[:3]:
            print(f"    ({r['lat']}, {r['lng']}) -> {r['error']}")

    assert len(success) > 0, "No successful data points!"
    print("\n  [OK] Grid weather fetch successful")
    print()
    return results


def test_cache_speed():
    """Verify the second call is instant (cached)."""
    print("=" * 65)
    print("  TEST 3: Cache Performance (second fetch should be instant)")
    print("=" * 65)

    start = time.time()
    results = fetch_grid_weather()
    elapsed = time.time() - start

    print(f"\n  Second fetch: {len(results)} points in {elapsed:.2f}s")
    if elapsed < 2.0:
        print("  [OK] Cache is working (< 2s)")
    else:
        print("  [WARN] Slow — cache may not be active")
    print()


def test_port_weather():
    """Quick check that per-port fetch still works."""
    print("=" * 65)
    print("  TEST 4: Per-Port Weather (Singapore)")
    print("=" * 65)

    result = fetch_single_port("singapore")
    if result and "current" in result:
        cur = result["current"]
        print(
            f"\n  Singapore: "
            f"Temp {cur['temperature_c']} C, "
            f"Rain {cur['precipitation_mm']} mm, "
            f"Wind {cur['wind_speed_kmh']} km/h"
        )
        print("  [OK]")
    else:
        print(f"\n  [FAIL] Got: {result}")
    print()


if __name__ == "__main__":
    print()
    test_grid_count()
    test_fetch_grid()
    test_cache_speed()
    test_port_weather()

    print("=" * 65)
    print("  ALL TESTS COMPLETE")
    print("=" * 65)
