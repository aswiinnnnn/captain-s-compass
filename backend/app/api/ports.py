"""Port intelligence router."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException

from app.schemas.ports import CalendarEventSchema, PortEntrySchema, PortRiskScoreResponse, RiskZoneSchema
from app.services import port_service

router = APIRouter(prefix="/ports", tags=["ports"])


@router.get("", response_model=list[PortEntrySchema])
def list_ports():
    return port_service.list_ports()


@router.get("/events", response_model=list[CalendarEventSchema])
def list_events(port_id: Optional[str] = None, type: Optional[str] = None):
    return port_service.list_events(port_id=port_id, event_type=type)


@router.get("/risk-zones", response_model=list[RiskZoneSchema])
def list_risk_zones():
    return port_service.list_risk_zones()


@router.get("/{port_id}", response_model=PortEntrySchema)
def get_port(port_id: str):
    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    return port


@router.get("/{port_id}/risk-score", response_model=PortRiskScoreResponse)
def get_risk_score(port_id: str):
    port = port_service.get_port(port_id)
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    score = port_service.compute_risk_score(port_id)
    return PortRiskScoreResponse(port_id=port_id, score=score)
