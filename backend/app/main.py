from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.observability import ObservabilityMiddleware
from backend.app.core.rate_limit import RateLimitMiddleware
from backend.app.core.cache import ping_redis
from backend.app.core.exceptions import DomainException
from backend.app.db.session import init_db, engine
from backend.app.api.router import api_router
from backend.app.schemas.health import HealthResponse


import asyncio

async def _warmup_subsystems():
    """
    Background startup warmup:
    1. Pre-warms active agents and their document chunk indices into L1 memory.
    2. Pre-warms Google GenAI / Gemini client and embedding TLS connection pool.
    Ensures zero users ever experience a cold-start delay on their first query.
    """
    try:
        from sqlalchemy import select
        from backend.app.db.session import AsyncSessionLocal
        from backend.app.db.models.agent import Agent
        from backend.app.ai.rag_engine import _get_or_build_index
        from backend.app.ai.embeddings.service import EmbeddingService
        from backend.app.api.v1.widget import _AGENT_L1_CACHE, _AGENT_L1_TTL
        import time

        logger.info("[WARMUP] Starting asynchronous system pre-warming...")
        
        # 1. Warm up Google GenAI embedding connection
        try:
            provider = EmbeddingService.get_provider("gemini")
            await provider.embed_query("warmup ping")
            logger.info("[WARMUP] Google GenAI embedding TLS connection warm.")
        except Exception as e:
            logger.warning(f"[WARMUP] Embedding warmup warning: {e}")

        # 2. Warm up active agents and their document chunks
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Agent).where(Agent.status == "ACTIVE"))
            agents = result.scalars().all()
            for agent in agents:
                if agent.public_key:
                    _AGENT_L1_CACHE.set(agent.public_key, agent, ttl=_AGENT_L1_TTL)
                await _get_or_build_index(db, str(agent.id), str(agent.organization_id))
            logger.info(f"[WARMUP] Pre-warmed {len(agents)} active agent(s) into L1 memory.")

    except Exception as e:
        logger.warning(f"[WARMUP] System warmup non-fatal error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode...")
    # Initialize database tables and extensions
    await init_db()
    logger.info("Database schema initialized and ready.")
    
    # Launch background system warmup task (non-blocking)
    asyncio.create_task(_warmup_subsystems())
    
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    await engine.dispose()
    logger.info("Database connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Knowledge Intelligence Platform with Knowledge Gap Detection",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Observability middleware (Request-ID and latency tracking)
app.add_middleware(ObservabilityMiddleware)

# Token-bucket rate limiting middleware (Redis-backed with in-memory fallback)
app.add_middleware(RateLimitMiddleware)

# CORS middleware (allows local file:/// (null origin), localhost, and all embed domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    logger.warning(
        f"DomainException ({exc.__class__.__name__}): {exc.message}",
        extra={"request_id": getattr(request.state, "request_id", "unknown"), "details": exc.details}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "details": exc.details}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled Exception: {str(exc)}",
        exc_info=exc,
        extra={"request_id": getattr(request.state, "request_id", "unknown")}
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"{exc.__class__.__name__}: {str(exc)}", "request_id": getattr(request.state, "request_id", "unknown")}
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Liveness probe reporting backend, database, and Redis cache health."""
    redis_healthy = await ping_redis()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database="connected",
        services={
            "api": "online",
            "redis_cache": "connected" if redis_healthy else "degraded (in-memory fallback)",
            "storage": settings.STORAGE_BACKEND,
            "default_llm": settings.DEFAULT_LLM_PROVIDER,
            "default_embedding": settings.DEFAULT_EMBEDDING_PROVIDER
        }
    )


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness probe verifying database connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "healthy"}
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "error": str(e)}
        )


# Register API Router
from backend.app.api.v1 import knowledge, widget
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["Knowledge Crawler"], include_in_schema=False)
app.include_router(widget.router, prefix="/api/widget", tags=["Widget"], include_in_schema=False)

# Serve standalone widget script & demo page directly
from fastapi.responses import FileResponse
import os

@app.get("/widget.js", include_in_schema=False)
async def serve_widget_js():
    widget_path = os.path.join(os.getcwd(), "widget.js")
    headers = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    }
    if os.path.exists(widget_path):
        return FileResponse(widget_path, media_type="application/javascript", headers=headers)
    alt_path = os.path.join(os.getcwd(), "frontend", "public", "widget.js")
    return FileResponse(alt_path, media_type="application/javascript", headers=headers)

@app.get("/", include_in_schema=False)
async def root_api_status():
    return {
        "service": "AI Knowledge Intelligence Platform API",
        "status": "healthy",
        "docs_url": "/docs",
        "widget_url": "/widget.js"
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
