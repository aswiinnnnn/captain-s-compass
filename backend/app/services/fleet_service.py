"""Fleet service — business logic for fleet operations."""

from __future__ import annotations

from app.providers.registry import get_fleet_provider


def list_vessels() -> list[dict]:
    return get_fleet_provider().get_vessels()


def get_vessel(vessel_id: str) -> dict | None:
    return get_fleet_provider().get_vessel(vessel_id)


def get_vessel_route(vessel_id: str) -> list[list[float]] | None:
    return get_fleet_provider().get_vessel_route(vessel_id)


def get_smart_options(vessel: dict) -> list[dict]:
    """Port of frontend's getSmartOptions logic."""
    opts: list[dict] = []
    factors = vessel.get("delayFactors", [])
    categories = {f["category"] for f in factors}
    demurrage = vessel.get("demurrageCostPerDay", 0)
    delay_hours = vessel.get("delayHours", 0)
    exposure = vessel.get("financialExposure", 0)

    if categories & {"weather", "congestion"}:
        opts.append({
            "id": "slow-down",
            "label": "Reduce Speed & Save Fuel",
            "description": "Slow to economical speed since arrival is delayed anyway",
            "tag": "Optimal",
            "costLabel": "FUEL SAVED",
            "costAmount": "-$18,200",
            "demurrageSave": "$0",
            "netBenefit": "+$18,200",
            "reasoning": "The port ahead is experiencing significant delays. Reducing speed saves ~$18,200 in bunker with zero impact on actual berth availability.",
        })

    if categories & {"port", "congestion"}:
        save = demurrage * 2
        opts.append({
            "id": "alt-port",
            "label": "Divert to Alternate Port",
            "description": "Reroute to nearby less congested port",
            "tag": "Neutral",
            "costLabel": "COST (ADMIN + TRUCKING)",
            "costAmount": "+$22,400",
            "demurrageSave": f"-${save:,}",
            "netBenefit": f"+${save - 22400:,}",
            "reasoning": f"Diverting saves ~2 days of waiting. Trucking cost $22,400 vs demurrage savings ${save:,}.",
        })

    if "political" in categories:
        opts.append({
            "id": "alt-route",
            "label": "Take Alternative Route",
            "description": "Avoid risk zone via longer but safer passage",
            "tag": "Neutral",
            "costLabel": "COST (FUEL + TIME)",
            "costAmount": "+$35,000",
            "demurrageSave": "-$0",
            "netBenefit": "Safety Priority",
            "reasoning": "Alternative route avoids the risk zone. Diversion cost is lower than insurance surcharge.",
        })

    if "client" in categories:
        save = round(exposure * 0.7)
        opts.append({
            "id": "negotiate-client",
            "label": "Negotiate Client Window Extension",
            "description": "Contact client to extend delivery window and avoid penalties",
            "tag": "Optimal",
            "costLabel": "COST (GOODWILL)",
            "costAmount": "$0",
            "demurrageSave": f"-${save:,}",
            "netBenefit": f"+${save:,}",
            "reasoning": "73% of clients accept a 24-48h extension when notified proactively.",
        })

    if "mechanical" in categories:
        opts.append({
            "id": "emergency-repair",
            "label": "Emergency Repair at Nearest Port",
            "description": "Divert for urgent mechanical repair to prevent worse failure",
            "tag": "Risky",
            "costLabel": "COST (REPAIR + DIVERSION)",
            "costAmount": "+$85,000",
            "demurrageSave": "Prevents $400k+ breakdown",
            "netBenefit": "+$315,000 (risk-adjusted)",
            "reasoning": "35% probability of escalating to full engine failure. Proactive repair is strongly favored.",
        })

    if "customs" in categories:
        save = round(demurrage * 0.25)
        opts.append({
            "id": "pre-clear",
            "label": "Pre-Clear Customs Remotely",
            "description": "Submit documentation ahead for faster processing",
            "tag": "Optimal",
            "costLabel": "COST (AGENT FEE)",
            "costAmount": "+$2,800",
            "demurrageSave": f"-${save:,}",
            "netBenefit": f"+${save - 2800:,}",
            "reasoning": "Local clearing agent pre-submits documentation, saving ~6 hours of port-side processing.",
        })

    # Always add wait option
    wait_cost = demurrage * max(1, delay_hours / 24)
    opts.append({
        "id": "wait",
        "label": "Hold Position & Wait",
        "description": "Maintain current course and wait for conditions to clear",
        "tag": "Risky",
        "costLabel": "COST (DELAY)",
        "costAmount": "+$0",
        "demurrageSave": "$0",
        "netBenefit": f"-${wait_cost:,.0f}",
        "reasoning": f"Waiting incurs demurrage of ${demurrage:,}/day with no active mitigation.",
    })

    return opts


def get_mitigation_strategies(vessel: dict) -> list[dict]:
    """Port of frontend's getMitigationStrategies logic."""
    demurrage = vessel.get("demurrageCostPerDay", 0)
    delay_hours = vessel.get("delayHours", 0)
    return [
        {
            "id": "speed-adjust",
            "label": "Option A: Speed Adjustment",
            "description": "Increase to 18.5 knots",
            "tag": "Optimal",
            "costLabel": "COST (FUEL)",
            "costAmount": "+$12,400",
            "demurrageSave": "-$28,000",
            "netBenefit": "+$15,600",
        },
        {
            "id": "alt-port",
            "label": "Option B: Alternate Port",
            "description": "Reroute to nearby alternate",
            "tag": "Neutral",
            "costLabel": "COST (ADMIN)",
            "costAmount": "+$4,200",
            "demurrageSave": "-$6,500",
            "netBenefit": "+$2,300",
        },
        {
            "id": "wait-berth",
            "label": "Option C: Wait for Berth",
            "description": "Hold position and wait",
            "tag": "Risky",
            "costLabel": "COST (DELAY)",
            "costAmount": "+$0",
            "demurrageSave": "$0",
            "netBenefit": f"-${demurrage * (delay_hours / 24):,.0f}",
        },
    ]
