"""Calendar event schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ============================================================================
# Shared properties
# ============================================================================
# (None specific to calendar events)


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
class EventCreateSchema(BaseModel):
    """Calendar event creation schema."""

    type: str  # 'holiday' | 'weather' | 'strike' | 'war_risk' | 'customs_delay'
    title: str
    description: str
    detail: str
    portId: Optional[str] = None
    region: str
    startDate: str
    endDate: str
    severity: str  # 'Low' | 'Moderate' | 'High' | 'Critical'


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in EventCreateSchema)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
class EventUpdateSchema(BaseModel):
    """Calendar event update schema."""

    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    detail: Optional[str] = None
    portId: Optional[str] = None
    region: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    severity: Optional[str] = None


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Covered in EventUpdateSchema)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class CalendarEventSchema(BaseModel):
    """Calendar event response with all properties."""

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


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in CalendarEventSchema)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for calendar event endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
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
