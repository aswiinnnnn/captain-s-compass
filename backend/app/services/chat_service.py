"""Chat service."""

from __future__ import annotations

from typing import Any

# from app.providers.registry import get_chat_provider


def get_ai_response(message: str, context: dict[str, Any] | None = None) -> str:
    ...