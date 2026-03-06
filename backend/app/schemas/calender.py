from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# ── Allowed literal values ──────────────────────────────────────────────────
EventType = Literal["holiday", "weather", "strike", "war_risk", "customs_delay"]
Severity = Literal["Low", "Moderate", "High", "Critical"]


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
class EventCreateSchema(BaseModel):
    """Calendar event creation schema (frontend → backend)."""
    type: EventType
    title: str
    description: str
    detail: str
    portId: Optional[str] = Field(None, validation_alias="port_id")
    region: str
    startDate: str = Field(..., validation_alias="start_date")
    endDate: str = Field(..., validation_alias="end_date")
    severity: Severity

    model_config = ConfigDict(populate_by_name=True)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
class EventUpdateSchema(BaseModel):
    """Calendar event update schema (partial)."""
    type: Optional[EventType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    detail: Optional[str] = None
    portId: Optional[str] = Field(None, validation_alias="port_id")
    region: Optional[str] = None
    startDate: Optional[str] = Field(None, validation_alias="start_date")
    endDate: Optional[str] = Field(None, validation_alias="end_date")
    severity: Optional[Severity] = None

    model_config = ConfigDict(populate_by_name=True)

# ============================================================================
# Response schema — returned to the frontend
# ============================================================================
class CalendarEventSchema(BaseModel):
    """Calendar event response with all properties.

    * ``from_attributes=True`` enables ``model_validate(orm_obj)``.
    * ``validation_alias`` maps snake_case ORM attributes → camelCase fields.
    """


    id: str
    type: str
    title: str
    description: str
    detail: str
    portId: Optional[str] = Field(None, validation_alias="port_id")
    region: str
    startDate: str = Field(..., validation_alias="start_date")
    endDate: str = Field(..., validation_alias="end_date")
    severity: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# ============================================================================
# Sync result schema
# ============================================================================
class SyncResultSchema(BaseModel):
    """Result of a provider sync operation."""

    synced: int
    message: str
