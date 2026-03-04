"""Bidding service."""

from __future__ import annotations

from app.providers.registry import get_bidding_provider


def list_canals() -> list[dict]:
    return get_bidding_provider().get_canals()


def get_canal(canal_id: str) -> dict | None:
    return get_bidding_provider().get_canal(canal_id)


def get_bid_history() -> list[dict]:
    return get_bidding_provider().get_bid_history()


def get_bid_factors() -> list[dict]:
    return get_bidding_provider().get_bid_factors()


def get_probability_data() -> list[dict]:
    return get_bidding_provider().get_probability_data()
