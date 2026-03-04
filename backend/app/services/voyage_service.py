"""Voyage service — route generation and port/vessel lookup."""

from __future__ import annotations

from app.providers.mock import generate_route_options
from app.providers.registry import get_voyage_provider


def list_ports() -> list[dict]:
    return get_voyage_provider().get_ports()


def list_vessels() -> list[dict]:
    return get_voyage_provider().get_vessels()


def compute_routes(from_port_id: str, to_port_id: str, vessel_id: str) -> list[dict]:
    ports = get_voyage_provider().get_ports()
    vessels = get_voyage_provider().get_vessels()

    from_port = next((p for p in ports if p["id"] == from_port_id), None)
    to_port = next((p for p in ports if p["id"] == to_port_id), None)
    vessel = next((v for v in vessels if v["id"] == vessel_id), None)

    if not from_port or not to_port or not vessel:
        return []

    return generate_route_options(from_port, to_port, vessel["name"])
