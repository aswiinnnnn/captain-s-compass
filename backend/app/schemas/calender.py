"""Calendar event schemas.

Field names use camelCase to match the frontend contract.
``validation_alias`` lets Pydantic populate from the snake_case ORM attributes.
``populate_by_name=True`` allows population via either the field name or the alias.
"""

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

    model_config = ConfigDict(populate_by_name=True)

    type: EventType
    title: str
    description: str
    detail: str
    portId: Optional[str] = Field(None, validation_alias="port_id")
    region: str
    startDate: str = Field(..., validation_alias="start_date")
    endDate: str = Field(..., validation_alias="end_date")
    severity: Severity

    def to_db_dict(self, *, event_id: str) -> dict:
        """Return a dict keyed with DB column names, suitable for ORM creation."""
        return {
            "id": event_id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "detail": self.detail,
            "port_id": self.portId,
            "region": self.region,
            "start_date": self.startDate,
            "end_date": self.endDate,
            "severity": self.severity,
        }


# ============================================================================
# Properties to receive via API on update
# ============================================================================
class EventUpdateSchema(BaseModel):
    """Calendar event update schema (partial)."""

    model_config = ConfigDict(populate_by_name=True)

    type: Optional[EventType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    detail: Optional[str] = None
    portId: Optional[str] = Field(None, validation_alias="port_id")
    region: Optional[str] = None
    startDate: Optional[str] = Field(None, validation_alias="start_date")
    endDate: Optional[str] = Field(None, validation_alias="end_date")
    severity: Optional[Severity] = None


# ============================================================================
# Response schema — returned to the frontend
# ============================================================================
class CalendarEventSchema(BaseModel):
    """Calendar event response with all properties.

    * ``from_attributes=True`` enables ``model_validate(orm_obj)``.
    * ``validation_alias`` maps snake_case ORM attributes → camelCase fields.
    """

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

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


# ============================================================================
# Sync result schema
# ============================================================================
class SyncResultSchema(BaseModel):
    """Result of a provider sync operation."""

    synced: int
    message: str
