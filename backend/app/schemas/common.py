"""Common schemas shared across domains."""

from __future__ import annotations

from pydantic import BaseModel


class PositionSchema(BaseModel):
    lat: float
    lng: float


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    timestamp: str
