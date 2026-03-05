"""Fleet schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from .common import PositionSchema


# ============================================================================
# Shared properties
# ============================================================================
class DelayFactorSchema(BaseModel):
    """Delay factor information."""

    name: str
    hours: float
    severity: str  # 'low' | 'medium' | 'high'
    category: str  # 'weather' | 'port' | 'customs' | 'political' | 'client' | 'mechanical' | 'congestion'
    detail: str


class SmartOptionSchema(BaseModel):
    """Smart option for risk mitigation."""

    id: str
    label: str
    description: str
    tag: str  # 'Optimal' | 'Neutral' | 'Risky'
    costLabel: str
    costAmount: str
    demurrageSave: str
    netBenefit: str
    reasoning: str


class MitigationStrategySchema(BaseModel):
    """Mitigation strategy information."""

    id: str
    label: str
    description: str
    tag: str  # 'Optimal' | 'Neutral' | 'Risky'
    costLabel: str
    costAmount: str
    demurrageSave: str
    netBenefit: str


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
# (Covered in FleetVesselCreateSchema)


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in FleetVesselCreateSchema)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
# (Covered in FleetVesselUpdateSchema)


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Covered in FleetVesselUpdateSchema)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class FleetVesselSchema(BaseModel):
    """Fleet vessel response with all properties."""

    id: str
    name: str
    imo: str
    type: str
    departurePort: str
    destinationPort: str
    speed: str
    heading: str
    draft: str
    fuelRemaining: str
    cargo: str
    position: PositionSchema
    eta: str
    etaDate: str
    voyageId: str
    riskScore: int
    riskLevel: str  # 'Low' | 'Medium' | 'High' | 'Critical'
    status: str
    delayHours: float
    delayFactors: list[DelayFactorSchema]
    financialExposure: float
    demurrageCostPerDay: float
    chartered: bool
    charterRate: Optional[float] = None


class AISShipSchema(BaseModel):
    """AIS (Automatic Identification System) ship data from real-time stream."""

    mmsi: str  # Maritime Mobile Service Identity
    latitude: float
    longitude: float
    speed: float  # Speed in knots
    heading: float  # Heading in degrees (0-359)
    timestamp: str  # ISO format datetime


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in FleetVesselSchema)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for fleet endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class FleetVesselInDBBase(BaseModel):
    """Fleet vessel base model from DB."""

    id: str
    name: str
    imo: str
    type: str
    departurePort: str
    destinationPort: str
    speed: str
    heading: str
    draft: str
    fuelRemaining: str
    cargo: str
    position: PositionSchema
    eta: str
    etaDate: str
    voyageId: str
    riskScore: int
    riskLevel: str
    status: str
    delayHours: float
    delayFactors: list[DelayFactorSchema]
    financialExposure: float
    demurrageCostPerDay: float
    chartered: bool
    charterRate: Optional[float] = None

    class Config:
        from_attributes = True
