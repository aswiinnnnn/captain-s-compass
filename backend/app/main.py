"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, bidding, chat, fleet, health, marine, ports, voyage
from app.config import settings

app = FastAPI(
    title="Captain's Compass API",
    description="Backend API for the AquaMinds fleet operations platform",
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(fleet.router, prefix="/api")
app.include_router(bidding.router, prefix="/api")
app.include_router(voyage.router, prefix="/api")
app.include_router(ports.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(marine.router, prefix="/api")
