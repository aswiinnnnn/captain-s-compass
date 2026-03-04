"""Port Intelligence schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ============================================================================
# Shared properties
# ============================================================================
class EquipmentItemSchema(BaseModel):
    """Equipment item information."""

    type: str  # 'Crane' | 'Forklift' | 'Truck' | 'Reach Stacker' | 'Straddle Carrier'
    totalUnits: int
    availableUnits: int
    status: str  # 'Operational' | 'Partial' | 'Under Maintenance'
    hireRatePerHour: float


class RiskZoneSchema(BaseModel):
    """Risk zone information."""

    id: str
    name: str
    type: str  # 'war_risk' | 'piracy' | 'restricted'
    region: str
    severity: str  # 'High' | 'Critical'
    description: str
    active: bool


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
class PortCreateSchema(BaseModel):
    """Port creation schema."""

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


class EventCreateSchema(BaseModel):
    """Calendar event creation schema."""

    type: str
    title: str
    description: str
    detail: str
    portId: Optional[str] = None
    region: str
    startDate: str
    endDate: str
    severity: str


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in PortCreateSchema and EventCreateSchema)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
class PortUpdateSchema(BaseModel):
    """Port update schema."""

    anchorageCostPerDay: Optional[float] = None
    berthCostPerHour: Optional[float] = None
    estimatedHandlingTimeHrs: Optional[float] = None
    congestionLevel: Optional[str] = None


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Covered in PortUpdateSchema)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class PortEntrySchema(BaseModel):
    """Port entry response with all properties."""

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


class CalendarEventSchema(BaseModel):
    """Calendar event response with all properties."""

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


class PortRiskScoreResponse(BaseModel):
    """Port risk score response."""

    port_id: str
    score: int


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in PortEntrySchema and CalendarEventSchema)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for port endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class PortInDBBase(BaseModel):
    """Port base model from DB."""

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
    congestionLevel: str
    lastUpdatedBy: str
    lastUpdatedAt: str

    class Config:
        from_attributes = True


class CalendarEventInDBBase(BaseModel):
    """Calendar event base model from DB."""

    id: str
    type: str
    title: str
    description: str
    detail: str
    portId: Optional[str] = None
    region: str
    startDate: str
    endDate: str
    severity: str

    class Config:
        from_attributes = True
