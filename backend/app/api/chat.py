"""Chat router."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
def send_message(body: ChatRequest):
    ctx = body.context.model_dump() if body.context else None
    response = chat_service.get_ai_response(body.message, ctx)
    return ChatResponse(response=response)
