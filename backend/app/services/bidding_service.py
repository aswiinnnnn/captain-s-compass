"""Bidding service."""

from __future__ import annotations

# from app.providers.registry import get_bidding_provider


def list_canals() -> list[dict]:
    ...


def get_canal(canal_id: str) -> dict | None:
    ...


def get_bid_history() -> list[dict]:
    ...

def get_bid_factors() -> list[dict]:
    ...
def get_probability_data() -> list[dict]:
    ...