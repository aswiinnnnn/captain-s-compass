"""Bidding router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.bidding import BidFactorSchema, BidProbabilitySchema, CanalPortSchema, PreviousBidSchema
from app.services import bidding_service

router = APIRouter(prefix="/bidding", tags=["bidding"])


@router.get("/canals", response_model=list[CanalPortSchema])
def list_canals():
    return bidding_service.list_canals()


@router.get("/canals/{canal_id}", response_model=CanalPortSchema)
def get_canal(canal_id: str):
    canal = bidding_service.get_canal(canal_id)
    if not canal:
        raise HTTPException(status_code=404, detail="Canal/port not found")
    return canal


@router.get("/history", response_model=list[PreviousBidSchema])
def get_bid_history():
    return bidding_service.get_bid_history()


@router.get("/factors", response_model=list[BidFactorSchema])
def get_bid_factors():
    return bidding_service.get_bid_factors()


@router.get("/probability", response_model=list[BidProbabilitySchema])
def get_probability():
    return bidding_service.get_probability_data()
