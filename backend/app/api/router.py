from fastapi import APIRouter
from backend.app.api.v1 import auth

api_router = APIRouter()

# API v1 sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
