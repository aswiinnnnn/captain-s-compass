"""Provider registry — returns mock or live providers based on DATA_MODE."""

from __future__ import annotations

from app.config import settings
from app.providers.base import (
    AuthProvider,
    BiddingProvider,
    ChatProvider,
    FleetProvider,
    PortProvider,
    VoyageProvider,
)
from app.providers.mock import (
    MockAuthProvider,
    MockBiddingProvider,
    MockChatProvider,
    MockFleetProvider,
    MockPortProvider,
    MockVoyageProvider,
)

# Singletons — created once at startup
_fleet: FleetProvider | None = None
_bidding: BiddingProvider | None = None
_port: PortProvider | None = None
_voyage: VoyageProvider | None = None
_auth: AuthProvider | None = None
_chat: ChatProvider | None = None


def _init_providers() -> None:
    global _fleet, _bidding, _port, _voyage, _auth, _chat  # noqa: PLW0603
    if settings.DATA_MODE == "mock":
        _fleet = MockFleetProvider()
        _bidding = MockBiddingProvider()
        _port = MockPortProvider()
        _voyage = MockVoyageProvider()
        _auth = MockAuthProvider()
        _chat = MockChatProvider()
    else:
        # Future: instantiate live providers here
        raise NotImplementedError(f"DATA_MODE={settings.DATA_MODE} not yet implemented")


def get_fleet_provider() -> FleetProvider:
    if _fleet is None:
        _init_providers()
    assert _fleet is not None
    return _fleet


def get_bidding_provider() -> BiddingProvider:
    if _bidding is None:
        _init_providers()
    assert _bidding is not None
    return _bidding


def get_port_provider() -> PortProvider:
    if _port is None:
        _init_providers()
    assert _port is not None
    return _port


def get_voyage_provider() -> VoyageProvider:
    if _voyage is None:
        _init_providers()
    assert _voyage is not None
    return _voyage


def get_auth_provider() -> AuthProvider:
    if _auth is None:
        _init_providers()
    assert _auth is not None
    return _auth


def get_chat_provider() -> ChatProvider:
    if _chat is None:
        _init_providers()
    assert _chat is not None
    return _chat
