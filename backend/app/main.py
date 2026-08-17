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
from backend.app.core.exceptions import DomainException
from backend.app.db.session import init_db, engine
from backend.app.api.router import api_router
from backend.app.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode...")
    # Initialize database tables and extensions
    await init_db()
    logger.info("Database schema initialized and ready.")
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

# CORS middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    logger.warning(
        f"DomainException: {exc.message}",
        extra={"request_id": getattr(request.state, "request_id", "unknown"), "details": exc.details}
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
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
        content={"detail": "An internal server error occurred", "request_id": getattr(request.state, "request_id", "unknown")}
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Liveness probe."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database="connected",
        services={
            "api": "online",
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
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
