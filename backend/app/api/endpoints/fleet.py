"""Fleet router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.fleet import FleetVesselSchema, MitigationStrategySchema, SmartOptionSchema
from app.services import fleet_service

router = APIRouter(prefix="/fleet", tags=["fleet"])


@router.get("/vessels", response_model=list[FleetVesselSchema])
def list_vessels():
    return fleet_service.list_vessels()


@router.get("/vessels/{vessel_id}", response_model=FleetVesselSchema)
def get_vessel(vessel_id: str):
    vessel = fleet_service.get_vessel(vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel


@router.get("/vessels/{vessel_id}/routes")
def get_vessel_route(vessel_id: str):
    route = fleet_service.get_vessel_route(vessel_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.get("/vessels/{vessel_id}/smart-options", response_model=list[SmartOptionSchema])
def get_smart_options(vessel_id: str):
    vessel = fleet_service.get_vessel(vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return fleet_service.get_smart_options(vessel)


@router.get("/vessels/{vessel_id}/mitigation", response_model=list[MitigationStrategySchema])
def get_mitigation(vessel_id: str):
    vessel = fleet_service.get_vessel(vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return fleet_service.get_mitigation_strategies(vessel)
