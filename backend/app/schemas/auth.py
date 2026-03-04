"""Auth schemas."""

from __future__ import annotations

from pydantic import BaseModel

from .common import PositionSchema


# ============================================================================
# Shared properties
# ============================================================================
class LoginRequest(BaseModel):
    """Login request with credentials."""

    email: str
    password: str


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
# (Inherited from base if needed)


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Inherited from base if needed)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
# (Inherited from base if needed)


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Inherited from base if needed)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class CaptainResponse(BaseModel):
    """Captain response with all properties."""

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


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in CaptainResponse)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for auth endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class CaptainInDBBase(BaseModel):
    """Captain base model from DB."""

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

    class Config:
        from_attributes = True
