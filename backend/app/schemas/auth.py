"""Auth schemas."""

from __future__ import annotations

from pydantic import BaseModel

from .common import PositionSchema


class LoginRequest(BaseModel):
    email: str
    password: str


class CaptainResponse(BaseModel):
    id: str
    name: str
    email: str
    shipName: str
    shipType: str
    cargoType: str
    imo: str
    currentSpeed: str
    heading: str
    draft: str
    fuelRemaining: str
    position: PositionSchema
    eta: str
    voyageId: str
    departurePort: str
    destinationPort: str
