"""Voyage planner schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class VoyagePortSchema(BaseModel):
    id: str
    name: str
    country: str
    code: str
    lat: float
    lng: float
    variants: list[str]  # ['Inbound', 'Outbound']


class VesselSchema(BaseModel):
    id: str
    name: str
    type: str
    draft: float
    imo: str


class WaypointSchema(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None


class VoyageRouteOptionSchema(BaseModel):
    id: str
    tag: str  # 'LOWEST COST' | 'FASTEST' | 'WEATHER OPTIMISED'
    subtitle: str
    color: str
    from_port: str  # renamed from 'from' (reserved word)
    to_port: str  # renamed from 'to' (reserved word)
    departureUTC: str
    arrivalUTC: str
    distanceNM: int
    avgSOG: float
    sailingTime: str
    fuelMT: int
    fuelCostUSD: int
    euaETS: float
    co2Tons: int
    waypoints: list[WaypointSchema]
    weatherRisk: str  # 'Low' | 'Moderate' | 'High'
    ecaTransitNM: int

    model_config = {"populate_by_name": True}


class RouteRequest(BaseModel):
    from_port_id: str
    to_port_id: str
    vessel_id: str
