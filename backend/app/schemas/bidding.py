"""Bidding schemas."""

from __future__ import annotations

from pydantic import BaseModel

from .common import PositionSchema


class BidRangeSchema(BaseModel):
    min: float
    max: float


class CanalPortSchema(BaseModel):
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


class PreviousBidSchema(BaseModel):
    time: str
    amount: float
    result: str  # 'Won' | 'Lost' | 'Expired'
    clearingPrice: float
    priority: str


class BidFactorSchema(BaseModel):
    name: str
    value: str
    impact: str  # 'up' | 'down' | 'neutral'
    description: str
    weight: float


class BidProbabilitySchema(BaseModel):
    bid: float
    probability: float
