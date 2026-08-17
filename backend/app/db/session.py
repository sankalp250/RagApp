import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from backend.app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Determine database URL: check if using SQLite fallback
db_url = settings.DATABASE_URL
if settings.USE_SQLITE_FALLBACK and not os.getenv("FORCE_POSTGRES"):
    # Ensure storage dir exists
    os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)
    sqlite_url = f"sqlite+aiosqlite:///{os.path.abspath(settings.SQLITE_DB_PATH)}"
    engine = create_async_engine(
        sqlite_url,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_async_engine(
        db_url,
        echo=False,
        future=True,
        pool_size=10,
        max_overflow=20
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and extensions."""
    async with engine.begin() as conn:
        if "postgresql" in str(engine.url):
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("pgvector extension enabled.")
            except Exception as e:
                logger.warning(f"Could not initialize pgvector extension: {e}")

        # Create all tables defined in models
        from backend.app.db.models import user, organization, agent, document, conversation, evaluation, knowledge_gap
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized.")
