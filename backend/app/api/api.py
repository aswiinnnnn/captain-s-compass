from app.api.endpoints import auth, bidding, calender, chat, fleet, health, marine, ports, voyage
from fastapi import APIRouter


api_router = APIRouter()

# Register routers under /api prefix
api_router.include_router(health.router, prefix="/health")
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(fleet.router, prefix="/fleet")
api_router.include_router(bidding.router, prefix="/bidding")
api_router.include_router(voyage.router, prefix="/voyage")
api_router.include_router(ports.router, prefix="/ports")
api_router.include_router(chat.router, prefix="/chat")
api_router.include_router(marine.router, prefix="/marine")
api_router.include_router(calender.router, prefix="/calendar")