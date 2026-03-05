"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.api import api_router
from app.config import settings
from app.providers.aisstream import start_ais_polling

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the AIS stream collection loop in the background
    ais_task = asyncio.create_task(start_ais_polling(interval_minutes=15, collect_duration=30))
    yield
    ais_task.cancel()

app = FastAPI(
    title="Captain's Compass API",
    description="Backend API for the AquaMinds fleet operations platform",
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API router
app.include_router(api_router, prefix="/api")
