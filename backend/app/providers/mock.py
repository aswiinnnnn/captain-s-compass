"""Mock provider implementations that read from JSON files."""

from __future__ import annotations

import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .base import (
    AuthProvider,
    BiddingProvider,
    ChatProvider,
    FleetProvider,
    PortProvider,
    VoyageProvider,
)

MOCK_DATA_DIR = Path(__file__).parent / "mock_data"


def _load_json(filename: str) -> Any:
    with open(MOCK_DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


# ─── Fleet ────────────────────────────────────────────


class MockFleetProvider(FleetProvider):
    def __init__(self) -> None:
        self._vessels: list[dict] = _load_json("fleet_vessels.json")
        self._routes: dict[str, list] = _load_json("vessel_routes.json")

    def get_vessels(self) -> list[dict]:
        return self._vessels

    def get_vessel(self, vessel_id: str) -> dict | None:
        return next((v for v in self._vessels if v["id"] == vessel_id), None)

    def get_vessel_route(self, vessel_id: str) -> list[list[float]] | None:
        return self._routes.get(vessel_id)


# ─── Bidding ──────────────────────────────────────────


class MockBiddingProvider(BiddingProvider):
    def __init__(self) -> None:
        self._canals: list[dict] = _load_json("canals_ports.json")
        self._bids: list[dict] = _load_json("bids.json")
        self._factors: list[dict] = _load_json("bid_factors.json")
        self._probability: list[dict] = _load_json("probability.json")

    def get_canals(self) -> list[dict]:
        return self._canals

    def get_canal(self, canal_id: str) -> dict | None:
        return next((c for c in self._canals if c["id"] == canal_id), None)

    def get_bid_history(self) -> list[dict]:
        return self._bids

    def get_bid_factors(self) -> list[dict]:
        return self._factors

    def get_probability_data(self) -> list[dict]:
        return self._probability


# ─── Port Intelligence ────────────────────────────────


class MockPortProvider(PortProvider):
    def __init__(self) -> None:
        self._ports: list[dict] = _load_json("port_entries.json")
        self._events: list[dict] = _load_json("calendar_events.json")
        self._risk_zones: list[dict] = _load_json("risk_zones.json")

    def get_ports(self) -> list[dict]:
        return self._ports

    def get_port(self, port_id: str) -> dict | None:
        return next((p for p in self._ports if p["id"] == port_id), None)

    def get_events(self, port_id: str | None = None, event_type: str | None = None) -> list[dict]:
        result = self._events
        if port_id:
            result = [e for e in result if e.get("portId") == port_id or e.get("portId") is None]
        if event_type:
            result = [e for e in result if e.get("type") == event_type]
        return result

    def get_risk_zones(self) -> list[dict]:
        return self._risk_zones


# ─── Voyage ───────────────────────────────────────────


class MockVoyageProvider(VoyageProvider):
    def __init__(self) -> None:
        self._ports: list[dict] = _load_json("voyage_ports.json")
        self._vessels: list[dict] = _load_json("vessels.json")

    def get_ports(self) -> list[dict]:
        return self._ports

    def get_vessels(self) -> list[dict]:
        return self._vessels


# ─── Auth ─────────────────────────────────────────────


class MockAuthProvider(AuthProvider):
    def __init__(self) -> None:
        self._captains: list[dict] = _load_json("captains.json")
        self._waypoints: list[list[float]] = _load_json("route_waypoints.json")

    def authenticate(self, email: str, password: str) -> dict | None:
        for c in self._captains:
            if c["email"] == email and c["password"] == password:
                # Return copy without password
                result = {k: v for k, v in c.items() if k != "password"}
                return result
        return None

    def get_route_waypoints(self) -> list[list[float]]:
        return self._waypoints


# ─── Chat ─────────────────────────────────────────────


class MockChatProvider(ChatProvider):
    """Port of the frontend's getAIResponse() logic."""

    def get_response(self, message: str, context: dict[str, Any] | None = None) -> str:
        msg = message.lower()
        ctx = context or {}
        canal_name = ctx.get("canalName", "Suez Canal")
        bid_amount = ctx.get("bidAmount")

        if any(w in msg for w in ("bid now", "place bid", "submit bid")):
            if bid_amount:
                amount = int(bid_amount)
                if amount < 40000:
                    prob = round((amount / 60000) * 85)
                    return (
                        f"**Risk Assessment: HIGH**\n\nYour bid of **${amount:,}** for {canal_name} "
                        f"is below the competitive threshold.\n\n**Win probability: ~{prob}%**\n\n"
                        "I strongly recommend increasing to **$44,800** to secure priority transit."
                    )
                elif amount <= 50000:
                    prob = min(96, round((amount / 50000) * 92))
                    return (
                        f"**Bid Analysis Complete — OPTIMAL**\n\nYour bid of **${amount:,}** for {canal_name} "
                        f"is well-positioned.\n\n**Win probability: ~{prob}%**\n\n"
                        f"**Estimated savings vs. ceiling:** ${62000 - amount:,}\n\nShall I proceed?"
                    )
                else:
                    return (
                        f"**Overpay Warning**\n\nYour bid of **${amount:,}** exceeds optimal range.\n\n"
                        "**AI Recommendation: $44,800** — same outcome, better savings."
                    )
            return "Set your amount using the slider, then I'll analyze optimal pricing."

        if any(w in msg for w in ("proceed", "confirm", "yes", "go ahead")):
            ref = f"VG-2025-{random.randint(1000, 9999)}"
            return (
                f"**Bid Placed Successfully**\n\n"
                f"| Detail | Value |\n|--------|-------|\n"
                f"| Transit | {canal_name} |\n"
                f"| Amount | ${bid_amount or 44800:,} |\n"
                f"| Status | Submitted |\n"
                f"| Confirmation | {ref} |"
            )

        if "weather" in msg:
            return (
                "**Weather Impact Analysis — Red Sea Corridor**\n\n"
                "- Wind: 25-35 kt NNW (increasing)\n- Swell: 1.8m → 3.2m predicted\n\n"
                "**Adjusted Recommendation:** Increase bid by **$3,200**"
            )

        if any(w in msg for w in ("hello", "hi", "hey")):
            return (
                "Welcome aboard, Captain!\n\nI'm your VoyageGuard AI assistant.\n\n"
                "**Active Voyage:** VYG-2025-0847\n**Next Waypoint:** Suez Canal\n\n"
                "What would you like to do?"
            )

        return (
            "Based on current intelligence:\n\n"
            "**Suez Canal Status:**\n- Queue: 24 vessels\n- Avg. clearing: $44,200\n\n"
            "**Recommended Action:** Bid $44,800 now — 88% win probability."
        )


# ─── Route Generation (ported from voyagePlannerData.ts) ──


def generate_waypoints(from_port: dict, to_port: dict, variation: float) -> list[dict]:
    """Generate waypoints between two ports with random variation."""
    pts: list[dict] = [{"lat": from_port["lat"], "lng": from_port["lng"], "name": from_port["name"]}]
    steps = 8 + random.randint(0, 3)
    for i in range(1, steps):
        t = i / steps
        lat = from_port["lat"] + (to_port["lat"] - from_port["lat"]) * t + (
            math.sin(t * math.pi) * variation * (random.random() - 0.3)
        )
        lng = from_port["lng"] + (to_port["lng"] - from_port["lng"]) * t + (
            math.sin(t * math.pi * 1.5) * variation * (random.random() - 0.3)
        )
        pts.append({"lat": round(lat, 4), "lng": round(lng, 4)})
    pts.append({"lat": to_port["lat"], "lng": to_port["lng"], "name": to_port["name"]})
    return pts


def calc_distance(wps: list[dict]) -> int:
    d = 0.0
    for i in range(1, len(wps)):
        dlat = (wps[i]["lat"] - wps[i - 1]["lat"]) * 60
        dlng = (wps[i]["lng"] - wps[i - 1]["lng"]) * 60 * math.cos(wps[i]["lat"] * math.pi / 180)
        d += math.sqrt(dlat**2 + dlng**2)
    return round(d)


def format_sailing_time(hours: float) -> str:
    d = int(hours // 24)
    h = int(hours % 24)
    m = round((hours % 1) * 60)
    return f"{d}d {h}h {m}m"


def generate_route_options(from_port: dict, to_port: dict, vessel_name: str) -> list[dict]:
    """Port of the frontend's generateRouteOptions function."""
    now = datetime.now(timezone.utc)
    departure_utc = (now + timedelta(hours=2)).isoformat()

    routes = []
    configs = [
        ("route-lowest-cost", "LOWEST COST", f"Economical · {vessel_name}", "#22C55E", 3, 10.5, 1.5, 1.8, "Low", 0.15),
        ("route-fastest", "FASTEST", f"Speed priority · {vessel_name}", "#0066CC", 1, 15.5, 2.0, 3.2, "High", 0.08),
        ("route-weather", "WEATHER OPTIMISED", f"Weather optimised · {vessel_name}", "#E87722", 5, 13.0, 1.0, 2.4, "Moderate", 0.2),
    ]

    for rid, tag, subtitle, color, var, base_speed, speed_range, fuel_rate, weather_risk, eca_pct in configs:
        wps = generate_waypoints(from_port, to_port, var)
        dist = calc_distance(wps)
        speed = base_speed + random.random() * speed_range
        hours = dist / speed
        arrival = (now + timedelta(hours=2 + hours)).isoformat()
        fuel = round(hours * fuel_rate)
        fuel_cost = round(fuel * 520)

        routes.append({
            "id": rid,
            "tag": tag,
            "subtitle": subtitle,
            "color": color,
            "from_port": f"{from_port['name']} ({from_port['country']}) Outbound",
            "to_port": f"{to_port['name']} ({to_port['country']}) Inbound",
            "departureUTC": departure_utc,
            "arrivalUTC": arrival,
            "distanceNM": dist,
            "avgSOG": round(speed, 1),
            "sailingTime": format_sailing_time(hours),
            "fuelMT": fuel,
            "fuelCostUSD": fuel_cost,
            "euaETS": round(fuel * 0.12, 1),
            "co2Tons": round(fuel * 3.114),
            "waypoints": wps,
            "weatherRisk": weather_risk,
            "ecaTransitNM": round(dist * eca_pct),
        })

    return routes
