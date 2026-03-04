"""Voyage planning router."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.voyage import RouteRequest, VesselSchema, VoyagePortSchema, VoyageRouteOptionSchema
from app.services import voyage_service

router = APIRouter(prefix="/voyage", tags=["voyage"])


@router.get("/ports", response_model=list[VoyagePortSchema])
def list_ports():
    return voyage_service.list_ports()


@router.get("/vessels", response_model=list[VesselSchema])
def list_vessels():
    return voyage_service.list_vessels()


@router.post("/routes", response_model=list[VoyageRouteOptionSchema])
def compute_routes(body: RouteRequest):
    return voyage_service.compute_routes(body.from_port_id, body.to_port_id, body.vessel_id)
