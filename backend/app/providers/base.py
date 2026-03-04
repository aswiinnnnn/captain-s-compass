"""Abstract base provider interfaces.

Each provider represents an external data source that can be swapped
between mock and live implementations via DATA_MODE config.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class FleetProvider(ABC):
    @abstractmethod
    def get_vessels(self) -> list[dict]:
        ...

    @abstractmethod
    def get_vessel(self, vessel_id: str) -> dict | None:
        ...

    @abstractmethod
    def get_vessel_route(self, vessel_id: str) -> list[list[float]] | None:
        ...


class BiddingProvider(ABC):
    @abstractmethod
    def get_canals(self) -> list[dict]:
        ...

    @abstractmethod
    def get_canal(self, canal_id: str) -> dict | None:
        ...

    @abstractmethod
    def get_bid_history(self) -> list[dict]:
        ...

    @abstractmethod
    def get_bid_factors(self) -> list[dict]:
        ...

    @abstractmethod
    def get_probability_data(self) -> list[dict]:
        ...


class PortProvider(ABC):
    @abstractmethod
    def get_ports(self) -> list[dict]:
        ...

    @abstractmethod
    def get_port(self, port_id: str) -> dict | None:
        ...

    @abstractmethod
    def get_events(self, port_id: str | None = None, event_type: str | None = None) -> list[dict]:
        ...

    @abstractmethod
    def get_risk_zones(self) -> list[dict]:
        ...


class VoyageProvider(ABC):
    @abstractmethod
    def get_ports(self) -> list[dict]:
        ...

    @abstractmethod
    def get_vessels(self) -> list[dict]:
        ...


class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, email: str, password: str) -> dict | None:
        ...

    @abstractmethod
    def get_route_waypoints(self) -> list[list[float]]:
        ...


class ChatProvider(ABC):
    @abstractmethod
    def get_response(self, message: str, context: dict[str, Any] | None = None) -> str:
        ...
