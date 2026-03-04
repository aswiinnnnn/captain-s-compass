"""Port intelligence service."""

from __future__ import annotations

from app.providers.registry import get_port_provider


def list_ports() -> list[dict]:
    return get_port_provider().get_ports()


def get_port(port_id: str) -> dict | None:
    return get_port_provider().get_port(port_id)


def list_events(port_id: str | None = None, event_type: str | None = None) -> list[dict]:
    return get_port_provider().get_events(port_id=port_id, event_type=event_type)


def list_risk_zones() -> list[dict]:
    return get_port_provider().get_risk_zones()


def compute_risk_score(port_id: str) -> int:
    """Port of frontend's getPortRiskScore logic."""
    events = get_port_provider().get_events()
    score = 0
    for e in events:
        if e.get("portId") == port_id or e.get("portId") is None:
            severity = e.get("severity", "")
            if severity == "Critical":
                score += 30
            elif severity == "High":
                score += 20
            elif severity == "Moderate":
                score += 10
            else:
                score += 5

    port = get_port_provider().get_port(port_id)
    if port:
        level = port.get("congestionLevel", "")
        if level == "Critical":
            score += 25
        elif level == "High":
            score += 15
        elif level == "Moderate":
            score += 8

    return min(score, 100)
