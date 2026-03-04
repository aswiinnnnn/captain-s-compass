"""Chat schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ChatContext(BaseModel):
    canalName: Optional[str] = None
    bidAmount: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[ChatContext] = None


class ChatResponse(BaseModel):
    response: str
