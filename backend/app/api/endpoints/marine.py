"""Marine summary router — aggregated dashboard data."""

from __future__ import annotations

from fastapi import APIRouter

from app.services import bidding_service, fleet_service, port_service

router = APIRouter(prefix="/marine", tags=["marine"])


@router.get("/summary")
def get_summary():
    vessels = fleet_service.list_vessels()
    canals = bidding_service.list_canals()
    ports = port_service.list_ports()

    at_risk = [v for v in vessels if v.get("riskLevel") in ("High", "Critical")]
    total_exposure = sum(v.get("financialExposure", 0) for v in vessels)
    active_bids = sum(1 for c in canals if c.get("requiresBidding") and c.get("congestionStatus") == "High")

    return {
        "totalVessels": len(vessels),
        "atRiskVessels": len(at_risk),
        "totalFinancialExposure": total_exposure,
        "activeBiddingCanals": active_bids,
        "totalPorts": len(ports),
        "criticalPorts": sum(1 for p in ports if p.get("congestionLevel") == "Critical"),
    }
