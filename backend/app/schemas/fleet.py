"""Fleet schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from .common import PositionSchema


class DelayFactorSchema(BaseModel):
    name: str
    hours: float
    severity: str  # 'low' | 'medium' | 'high'
    category: str  # 'weather' | 'port' | 'customs' | 'political' | 'client' | 'mechanical' | 'congestion'
    detail: str


class FleetVesselSchema(BaseModel):
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


class SmartOptionSchema(BaseModel):
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
    id: str
    label: str
    description: str
    tag: str  # 'Optimal' | 'Neutral' | 'Risky'
    costLabel: str
    costAmount: str
    demurrageSave: str
    netBenefit: str
