"""Port intelligence service."""

from __future__ import annotations

# from app.providers.registry import get_port_provider


def list_ports() -> list[dict]:
    ...


def get_port(port_id: str) -> dict | None:
    ...


def list_events(port_id: str | None = None, event_type: str | None = None) -> list[dict]:
    ...

def list_risk_zones() -> list[dict]:
    ...


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

    port = None
    if port:
        level = port.get("congestionLevel", "")
        if level == "Critical":
            score += 25
        elif level == "High":
            score += 15
        elif level == "Moderate":
            score += 8

    return min(score, 100)
