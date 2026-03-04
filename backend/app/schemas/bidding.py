"""Bidding schemas."""

from __future__ import annotations

from pydantic import BaseModel

from .common import PositionSchema


# ============================================================================
# Shared properties
# ============================================================================
class BidRangeSchema(BaseModel):
    """Bid range with min and max values."""

    min: float
    max: float


class BidFactorSchema(BaseModel):
    """Bid factor information."""

    name: str
    value: str
    impact: str  # 'up' | 'down' | 'neutral'
    description: str
    weight: float


class BidProbabilitySchema(BaseModel):
    """Bid probability information."""

    bid: float
    probability: float


class PreviousBidSchema(BaseModel):
    """Previous bid information."""

    time: str
    amount: float
    result: str  # 'Won' | 'Lost' | 'Expired'
    clearingPrice: float
    priority: str


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
# (Covered in CanalPortCreateSchema)


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in CanalPortCreateSchema)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
# (Covered in CanalPortUpdateSchema)


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Covered in CanalPortUpdateSchema)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class CanalPortSchema(BaseModel):
    """Canal/Port response with all properties."""

    id: str
    name: str
    type: str  # 'canal' | 'port' | 'strait'
    description: str
    distance: str
    eta: str
    requiresBidding: bool
    requiresBooking: bool
    congestionStatus: str  # 'Low' | 'Medium' | 'High'
    weatherRisk: str  # 'Low' | 'Medium' | 'High'
    rules: list[str]
    historicalCongestion: str
    position: PositionSchema
    currentBidRange: BidRangeSchema
    avgClearingPrice: float
    queueLength: int
    securityLevel: str  # 'Normal' | 'Elevated' | 'High'


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in CanalPortSchema)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for bidding endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class CanalPortInDBBase(BaseModel):
    """Canal/Port base model from DB."""

    id: str
    name: str
    type: str
    description: str
    distance: str
    eta: str
    requiresBidding: bool
    requiresBooking: bool
    congestionStatus: str
    weatherRisk: str
    rules: list[str]
    historicalCongestion: str
    position: PositionSchema
    currentBidRange: BidRangeSchema
    avgClearingPrice: float
    queueLength: int
    securityLevel: str

    class Config:
        from_attributes = True
