"""Auth router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

# from app.providers.registry import get_auth_provider
from app.schemas.auth import CaptainResponse, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=CaptainResponse)
def login(body: LoginRequest):
    result = None
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return result


@router.get("/route-waypoints")
def get_route_waypoints():
    ...
    # return get_auth_provider().get_route_waypoints()
