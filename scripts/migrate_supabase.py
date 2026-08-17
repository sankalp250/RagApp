"""
Supabase Schema Migration Script
=================================
Creates all application tables in the Supabase PostgreSQL database.
Run this ONCE to initialize the schema, then use Alembic for future changes.

Usage:
    FORCE_POSTGRES=1 python scripts/migrate_supabase.py

Or just:
    python scripts/migrate_supabase.py
    (reads DATABASE_URL from .env, bypasses SQLite fallback)
"""
import asyncio
import os
import sys

# Force PostgreSQL — bypass SQLite fallback in session.py
os.environ["FORCE_POSTGRES"] = "1"

# Make sure we can import from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or "sqlite" in DATABASE_URL:
    print("ERROR: DATABASE_URL is not set or points to SQLite.")
    print("Set DATABASE_URL in .env to your Supabase PostgreSQL connection string.")
    sys.exit(1)

print(f"\nTarget database: {DATABASE_URL.split('@')[-1]}")  # show host only, hide password
print("=" * 60)


async def run_migration():
    engine = create_async_engine(DATABASE_URL, echo=True, future=True)

    # Import ALL models so SQLAlchemy knows about them
    from backend.app.db.session import Base
    import backend.app.db.models.user
    import backend.app.db.models.organization
    import backend.app.db.models.agent
    import backend.app.db.models.document
    import backend.app.db.models.conversation
    import backend.app.db.models.evaluation
    import backend.app.db.models.knowledge_gap

    async with engine.begin() as conn:
        # Step 1: Enable pgvector extension
        print("\n[1/3] Enabling pgvector extension...")
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            print("      pgvector extension: OK")
        except Exception as e:
            print(f"      pgvector extension warning (may already exist): {e}")

        # Step 2: Enable uuid-ossp for UUID generation
        print("[2/3] Enabling uuid-ossp extension...")
        try:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            print("      uuid-ossp extension: OK")
        except Exception as e:
            print(f"      uuid-ossp warning: {e}")

        # Step 3: Create all tables
        print("[3/3] Creating all tables (CREATE TABLE IF NOT EXISTS)...")
        await conn.run_sync(Base.metadata.create_all)
        print("      All tables created successfully!")

    # Verify by listing tables
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
        ))
        tables = [row[0] for row in result.fetchall()]

    print("\n" + "=" * 60)
    print(f"SCHEMA READY — {len(tables)} tables in Supabase:")
    for t in tables:
        print(f"  - {t}")
    print("=" * 60)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migration())
