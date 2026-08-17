"""
Redis Cache Manager
====================
Tenant-scoped caching via Upstash Redis.
Used for:
  - Semantic response caching (same query → same answer)
  - Widget config caching (avoid DB lookup per chat widget load)
  - Agent configuration caching

Cache keys are always prefixed with org_id to enforce tenant isolation.
TTLs are short enough to keep data fresh but long enough to meaningfully reduce DB load.
"""
import json
import hashlib
from typing import Optional, Any
from backend.app.core.config import settings
from backend.app.core.logging import logger


def _get_redis_client():
    """Lazily initialise the Redis client (Upstash TLS or local)."""
    try:
        import redis.asyncio as aioredis  # type: ignore
        client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3
        )
        return client
    except Exception as e:
        logger.warning(f"Redis client init failed (caching disabled): {e}")
        return None


_redis_client = None


def get_cache():
    global _redis_client
    if _redis_client is None:
        _redis_client = _get_redis_client()
    return _redis_client


# ─── Cache Key Builders ───────────────────────────────────────────────────────

def _chat_cache_key(organization_id: str, agent_id: str, query: str) -> str:
    """Semantic cache key for a chat query — hashed to avoid long keys."""
    query_hash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:16]
    return f"chat:{organization_id}:{agent_id}:{query_hash}"


def _widget_config_key(public_key: str) -> str:
    return f"widget:config:{public_key}"


def _agent_key(organization_id: str, agent_id: str) -> str:
    return f"agent:{organization_id}:{agent_id}"


# ─── Cache Operations ─────────────────────────────────────────────────────────

CHAT_CACHE_TTL = 300        # 5 minutes
WIDGET_CONFIG_TTL = 600     # 10 minutes
AGENT_CONFIG_TTL = 120      # 2 minutes


async def get_cached_chat(organization_id: str, agent_id: str, query: str) -> Optional[dict]:
    """Return cached chat response or None if not cached."""
    redis = get_cache()
    if not redis:
        return None
    try:
        key = _chat_cache_key(organization_id, agent_id, query)
        data = await redis.get(key)
        if data:
            logger.debug(f"Cache HIT: {key}")
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Cache read error (non-fatal): {e}")
    return None


async def set_cached_chat(
    organization_id: str, agent_id: str, query: str, response: dict, ttl: int = CHAT_CACHE_TTL
) -> None:
    """Cache a chat response."""
    redis = get_cache()
    if not redis:
        return
    try:
        key = _chat_cache_key(organization_id, agent_id, query)
        await redis.setex(key, ttl, json.dumps(response))
        logger.debug(f"Cache SET: {key} (TTL={ttl}s)")
    except Exception as e:
        logger.warning(f"Cache write error (non-fatal): {e}")


async def get_cached_widget_config(public_key: str) -> Optional[dict]:
    """Return cached widget config or None."""
    redis = get_cache()
    if not redis:
        return None
    try:
        key = _widget_config_key(public_key)
        data = await redis.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Widget config cache read error: {e}")
    return None


async def set_cached_widget_config(public_key: str, config: dict) -> None:
    """Cache widget configuration."""
    redis = get_cache()
    if not redis:
        return
    try:
        key = _widget_config_key(public_key)
        await redis.setex(key, WIDGET_CONFIG_TTL, json.dumps(config))
    except Exception as e:
        logger.warning(f"Widget config cache write error: {e}")


async def invalidate_agent_cache(organization_id: str, agent_id: str) -> None:
    """Invalidate all cache entries for an agent (called when agent is updated)."""
    redis = get_cache()
    if not redis:
        return
    try:
        pattern = f"chat:{organization_id}:{agent_id}:*"
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries for agent {agent_id}")
    except Exception as e:
        logger.warning(f"Cache invalidation error: {e}")


async def ping_redis() -> bool:
    """Health check — returns True if Redis is reachable."""
    redis = get_cache()
    if not redis:
        return False
    try:
        return await redis.ping()
    except Exception:
        return False
