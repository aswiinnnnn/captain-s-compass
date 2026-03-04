"""Chat schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


# ============================================================================
# Shared properties
# ============================================================================
class ChatContext(BaseModel):
    """Chat context information."""

    canalName: Optional[str] = None
    bidAmount: Optional[float] = None


# ============================================================================
# Properties to receive via API on creation
# ============================================================================
class ChatRequest(BaseModel):
    """Chat request with message and context."""

    message: str
    context: Optional[ChatContext] = None


# ============================================================================
# Properties to receive in DB on creation
# ============================================================================
# (Covered in ChatRequest)


# ============================================================================
# Properties to receive via API on update
# ============================================================================
# (Not applicable for chat)


# ============================================================================
# Properties to receive in DB on update
# ============================================================================
# (Not applicable for chat)


# ============================================================================
# Additional properties to return via API
# ============================================================================
class ChatResponse(BaseModel):
    """Chat response with generated response."""

    response: str


# ============================================================================
# Additional properties stored in DB
# ============================================================================
# (Covered in ChatResponse)


# ============================================================================
# Property for pagination
# ============================================================================
# Not applicable for chat endpoints


# ============================================================================
# Schema to get from the DB
# ============================================================================
class ChatInDBBase(BaseModel):
    """Chat base model from DB."""

    response: str

    class Config:
        from_attributes = True
