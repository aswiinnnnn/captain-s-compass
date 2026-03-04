"""Voyage planner schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ============================================================================
# Shared properties
# ============================================================================
class WaypointSchema(BaseModel):
    """Waypoint with latitude and longitude."""

    lat: float
    lng: float
    name: Optional[str] = None


class VoyagePortSchema(BaseModel):
    """Voyage port information."""

    id: str
    name: str
    country: str
    code: str
    lat: float
    lng: float
    variants: list[str]  # ['Inbound', 'Outbound']


class VesselSchema(BaseModel):
    """Vessel information."""

    id: str
    name: str
    type: str
    draft: float
    imo: str


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
class RouteRequest(BaseModel):
    """Route request for voyage planning."""

    from_port_id: str
    to_port_id: str
    vessel_id: str


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in RouteRequest)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
# (Not applicable for voyage endpoints)


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Not applicable for voyage endpoints)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class VoyageRouteOptionSchema(BaseModel):
    """Voyage route option response."""

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


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in VoyageRouteOptionSchema)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for voyage endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class VoyageRouteOptionInDBBase(BaseModel):
    """Voyage route option base model from DB."""

    id: str
    tag: str
    subtitle: str
    color: str
    from_port: str
    to_port: str
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
    weatherRisk: str
    ecaTransitNM: int

    class Config:
        from_attributes = True
        populate_by_name = True
