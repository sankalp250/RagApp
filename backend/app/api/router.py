from fastapi import APIRouter
from backend.app.api.v1 import auth, organizations, agents

api_router = APIRouter()

# API v1 sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
