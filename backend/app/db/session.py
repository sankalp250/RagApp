import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from backend.app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Determine database URL and configure production-grade engine parameters
db_url = settings.DATABASE_URL
if settings.USE_SQLITE_FALLBACK and not os.getenv("FORCE_POSTGRES"):
    # Ensure storage directory exists
    os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)
    sqlite_url = f"sqlite+aiosqlite:///{os.path.abspath(settings.SQLITE_DB_PATH)}"
    engine = create_async_engine(
        sqlite_url,
        echo=False,
        future=True,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False, "timeout": 60.0}
    )
else:
    engine = create_async_engine(
        db_url,
        echo=False,
        future=True,
        pool_pre_ping=True,       # Verifies connection liveness before checkout; auto-reconnects if dead
        pool_recycle=1800,        # Recycles connections every 30 minutes to prevent stale/closed connections
        pool_size=5,              # Conservative connection pool for free tier DB
        max_overflow=5,           # Extra burst connections
        pool_timeout=30,          # Connection checkout timeout
        connect_args={
            "server_settings": {
                "jit": "off"      # Disables PostgreSQL JIT to optimize fast OLTP queries
            }
        } if "postgresql" in db_url else {}
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining a resilient async database session."""
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
        if "sqlite" in str(engine.url):
            try:
                await conn.execute(text("PRAGMA journal_mode=WAL;"))
                await conn.execute(text("PRAGMA busy_timeout=60000;"))
                await conn.execute(text("PRAGMA synchronous=NORMAL;"))
                logger.info("SQLite WAL mode and busy_timeout enabled.")
            except Exception as e:
                logger.warning(f"Could not enable SQLite WAL mode: {e}")
        elif "postgresql" in str(engine.url):
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("pgvector extension enabled.")
            except Exception as e:
                logger.warning(f"Could not initialize pgvector extension: {e}")

        # Create all tables defined in models
        from backend.app.db.models import user, organization, agent, document, conversation, evaluation, knowledge_gap, crawler
        await conn.run_sync(Base.metadata.create_all)

        # Lightweight schema migrations for existing databases
        columns_to_add = [
            ("documents", "knowledge_source_id", "VARCHAR(36)"),
            ("documents", "source_page_id", "VARCHAR(36)"),
            ("documents", "title", "VARCHAR(500)"),
            ("documents", "source_url", "VARCHAR(1000)"),
            ("documents", "canonical_url", "VARCHAR(1000)"),
            ("documents", "content", "TEXT"),
            ("documents", "content_hash", "VARCHAR(64)"),
            ("documents", "previous_hash", "VARCHAR(64)"),
            ("documents", "version", "INTEGER DEFAULT 1"),
            ("documents", "is_active", "BOOLEAN DEFAULT 1"),
            ("document_chunks", "content_hash", "VARCHAR(64)"),
            ("knowledge_sources", "current_version", "INTEGER DEFAULT 1"),
            ("crawl_jobs", "pages_unchanged", "INTEGER DEFAULT 0"),
            ("crawl_jobs", "pages_changed", "INTEGER DEFAULT 0"),
            ("crawl_jobs", "pages_new", "INTEGER DEFAULT 0"),
            ("crawl_jobs", "pages_removed", "INTEGER DEFAULT 0"),
            ("crawl_jobs", "crawl_version", "INTEGER DEFAULT 1"),
            ("crawl_runs", "pages_unchanged", "INTEGER DEFAULT 0"),
            ("crawl_runs", "pages_changed", "INTEGER DEFAULT 0"),
            ("crawl_runs", "pages_new", "INTEGER DEFAULT 0"),
            ("crawl_runs", "pages_removed", "INTEGER DEFAULT 0"),
            ("crawled_pages", "previous_hash", "VARCHAR(64)"),
            ("crawled_pages", "change_status", "VARCHAR(50) DEFAULT 'NEW'"),
            ("crawled_pages", "crawl_version", "INTEGER DEFAULT 1"),
            ("crawled_pages", "is_active", "BOOLEAN DEFAULT 1"),
            ("knowledge_gaps", "topic", "VARCHAR(255)"),
            ("knowledge_gaps", "sample_questions", "TEXT DEFAULT '[]'"),
            ("knowledge_gaps", "confidence", "FLOAT DEFAULT 0.5"),
            ("knowledge_gaps", "embedding", "TEXT"),
            ("knowledge_gaps", "retrieval_metrics", "TEXT DEFAULT '{}'"),
            ("knowledge_gaps", "feedback_metrics", "TEXT DEFAULT '{}'"),
            ("knowledge_gaps", "first_seen_at", "TIMESTAMP"),
            ("knowledge_gaps", "last_seen_at", "TIMESTAMP"),
        ]
        for tbl, col, col_type in columns_to_add:
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_type};"))
            except Exception:
                pass  # Column already exists

        logger.info("Database schema initialized.")
