"""Port Intelligence schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class EquipmentItemSchema(BaseModel):
    type: str  # 'Crane' | 'Forklift' | 'Truck' | 'Reach Stacker' | 'Straddle Carrier'
    totalUnits: int
    availableUnits: int
    status: str  # 'Operational' | 'Partial' | 'Under Maintenance'
    hireRatePerHour: float


class PortEntrySchema(BaseModel):
    id: str
    name: str
    country: str
    region: str
    code: str
    lat: float
    lng: float
    anchorageCostPerDay: float
    berthCostPerHour: float
    equipment: list[EquipmentItemSchema]
    estimatedHandlingTimeHrs: float
    congestionLevel: str  # 'Low' | 'Moderate' | 'High' | 'Critical'
    lastUpdatedBy: str
    lastUpdatedAt: str


class PortCreateSchema(BaseModel):
    name: str
    country: str
    region: str
    code: str
    lat: float
    lng: float
    anchorageCostPerDay: float = 0
    berthCostPerHour: float = 0
    equipment: list[EquipmentItemSchema] = []
    estimatedHandlingTimeHrs: float = 24
    congestionLevel: str = "Low"


class PortUpdateSchema(BaseModel):
    anchorageCostPerDay: Optional[float] = None
    berthCostPerHour: Optional[float] = None
    estimatedHandlingTimeHrs: Optional[float] = None
    congestionLevel: Optional[str] = None


class CalendarEventSchema(BaseModel):
    id: str
    type: str  # 'holiday' | 'weather' | 'strike' | 'war_risk' | 'customs_delay'
    title: str
    description: str
    detail: str
    portId: Optional[str] = None
    region: str
    startDate: str
    endDate: str
    severity: str  # 'Low' | 'Moderate' | 'High' | 'Critical'


class EventCreateSchema(BaseModel):
    type: str
    title: str
    description: str
    detail: str
    portId: Optional[str] = None
    region: str
    startDate: str
    endDate: str
    severity: str


class RiskZoneSchema(BaseModel):
    id: str
    name: str
    type: str  # 'war_risk' | 'piracy' | 'restricted'
    region: str
    severity: str  # 'High' | 'Critical'
    description: str
    active: bool


class PortRiskScoreResponse(BaseModel):
    port_id: str
    score: int
