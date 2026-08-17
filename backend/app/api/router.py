from fastapi import APIRouter
from backend.app.api.v1 import auth, organizations, agents, documents, chat, widget, analytics

api_router = APIRouter()

# ─── Authentication ──────────────────────────────────────────────────────────
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# ─── Multi-tenant Organizations ──────────────────────────────────────────────
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])

# ─── Agent Management ────────────────────────────────────────────────────────
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])

# ─── Knowledge Base Documents ─────────────────────────────────────────────────
api_router.include_router(documents.router, prefix="", tags=["Documents"])

# ─── Chat & RAG ──────────────────────────────────────────────────────────────
api_router.include_router(chat.router, prefix="", tags=["Chat"])

# ─── Public Widget (Unauthenticated) ─────────────────────────────────────────
api_router.include_router(widget.router, prefix="/widget", tags=["Widget"])

# ─── Analytics & Intelligence ────────────────────────────────────────────────
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
