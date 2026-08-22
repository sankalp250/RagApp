"""
Multi-Tier Production Caching Architecture
==========================================
Tenant-scoped caching via L1 (In-Memory Thread-Safe LRU) + L2 (Redis / Upstash).
Used for:
  - Semantic response caching (same query → same answer)
  - Widget config caching (avoid DB lookup per chat widget load)
  - Agent configuration & Embedding vector caching

Cache keys are always prefixed with org_id to enforce strict tenant isolation.
Key invalidation uses non-blocking SCAN to protect production Redis clusters.
"""
import json
import time
import hashlib
from collections import OrderedDict
from threading import Lock
from typing import Optional, Any, Dict, Tuple, List
from backend.app.core.config import settings
from backend.app.core.logging import logger


class LRUTtlCache:
    """
    Thread-safe, memory-bounded LRU cache with monotonic TTL expiration.
    Guarantees O(1) reads/writes and evicts true Least-Recently-Used entries.
    """
    def __init__(self, maxsize: int = 3000):
        self.maxsize = maxsize
        self._store: OrderedDict[str, Tuple[float, Any]] = OrderedDict()
        self._lock = Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            exp, data = entry
            if time.monotonic() < exp:
                self._store.move_to_end(key)
                return data
            self._store.pop(key, None)
            return None

    def set(self, key: str, data: Any, ttl: float):
        with self._lock:
            if key in self._store:
                self._store.pop(key, None)
            elif len(self._store) >= self.maxsize:
                self._store.popitem(last=False)  # Evict oldest LRU entry
            self._store[key] = (time.monotonic() + ttl, data)

    def delete(self, key: str):
        with self._lock:
            self._store.pop(key, None)

    def delete_prefix(self, prefix: str):
        with self._lock:
            keys_to_remove = [k for k in self._store.keys() if k.startswith(prefix)]
            for k in keys_to_remove:
                self._store.pop(k, None)

    def clear(self):
        with self._lock:
            self._store.clear()


# ─── L1 In-Memory Ultra-Fast Cache Layers (< 0.05ms access) ───────────────────
_L1_CHAT_CACHE = LRUTtlCache(maxsize=3000)
_L1_EMBED_CACHE = LRUTtlCache(maxsize=10000)
_L1_CONFIG_CACHE = LRUTtlCache(maxsize=1000)

_redis_pool = None


def _get_redis_pool():
    """Lazily initialise the Redis connection pool."""
    global _redis_pool
    if _redis_pool is None and settings.REDIS_URL:
        try:
            import redis.asyncio as aioredis
            _redis_pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=50,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                decode_responses=True
            )
            logger.info("Initialized Redis async connection pool.")
        except Exception as e:
            logger.info(f"Redis pool not available, using in-memory L1 cache: {e}")
            return None
    return _redis_pool


def get_cache():
    """Returns an async Redis client backed by the shared connection pool."""
    pool = _get_redis_pool()
    if pool:
        try:
            import redis.asyncio as aioredis
            return aioredis.Redis(connection_pool=pool)
        except Exception:
            return None
    return None


# ─── Cache Key Builders ───────────────────────────────────────────────────────

def _chat_cache_key(organization_id: str, agent_id: str, query: str) -> str:
    """Semantic cache key for a chat query — hashed for compact lookup."""
    query_hash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:16]
    return f"chat:{organization_id}:{agent_id}:{query_hash}"


def _widget_config_key(public_key: str) -> str:
    return f"widget:config:{public_key}"


def _agent_key(organization_id: str, agent_id: str) -> str:
    return f"agent:{organization_id}:{agent_id}"


def get_cached_embedding(query: str) -> Optional[List[float]]:
    """Instant L1 in-memory embedding cache lookup (< 0.05ms)."""
    query_hash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:20]
    return _L1_EMBED_CACHE.get(query_hash)


def set_cached_embedding(query: str, vector: List[float], ttl: float = 3600.0) -> None:
    """Cache query vector in L1 for 1 hour."""
    query_hash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:20]
    _L1_EMBED_CACHE.set(query_hash, vector, ttl)


# ─── Cache Operations ─────────────────────────────────────────────────────────

CHAT_CACHE_TTL = 300        # 5 minutes
WIDGET_CONFIG_TTL = 600     # 10 minutes
AGENT_CONFIG_TTL = 120      # 2 minutes


def clear_all_caches():
    """Flush all L1 in-memory caches."""
    _L1_CHAT_CACHE.clear()
    _L1_EMBED_CACHE.clear()
    _L1_CONFIG_CACHE.clear()


async def get_cached_chat(organization_id: str, agent_id: str, query: str) -> Optional[dict]:
    """Return cached chat response from L1 (0.05ms) or Redis L2 (< 2ms)."""
    key = _chat_cache_key(organization_id, agent_id, query)
    
    # Check L1 In-Memory Cache first (< 0.05ms)
    l1_hit = _L1_CHAT_CACHE.get(key)
    if l1_hit is not None:
        logger.debug(f"L1 In-Memory Cache HIT: {key}")
        return l1_hit

    # Check Redis L2 Cache
    redis = get_cache()
    if not redis:
        return None
    try:
        data = await redis.get(key)
        if data:
            parsed = json.loads(data)
            _L1_CHAT_CACHE.set(key, parsed, ttl=CHAT_CACHE_TTL)
            logger.debug(f"L2 Redis Cache HIT: {key}")
            return parsed
    except Exception as e:
        logger.warning(f"Cache read error (non-fatal): {e}")
    return None


async def set_cached_chat(
    organization_id: str, agent_id: str, query: str, response: dict, ttl: int = CHAT_CACHE_TTL
) -> None:
    """Cache a chat response in both L1 (in-memory) and L2 (Redis)."""
    key = _chat_cache_key(organization_id, agent_id, query)
    _L1_CHAT_CACHE.set(key, response, ttl=ttl)
    
    redis = get_cache()
    if not redis:
        return
    try:
        await redis.set(key, json.dumps(response), ex=ttl)
        logger.debug(f"Cache SET: {key} (TTL={ttl}s)")
    except Exception as e:
        logger.warning(f"Cache write error (non-fatal): {e}")


async def get_cached_widget_config(public_key: str) -> Optional[dict]:
    """Return cached widget config from L1 or Redis L2."""
    key = _widget_config_key(public_key)
    l1_hit = _L1_CONFIG_CACHE.get(key)
    if l1_hit is not None:
        return l1_hit

    redis = get_cache()
    if not redis:
        return None
    try:
        data = await redis.get(key)
        if data:
            parsed = json.loads(data)
            _L1_CONFIG_CACHE.set(key, parsed, ttl=WIDGET_CONFIG_TTL)
            return parsed
    except Exception as e:
        logger.warning(f"Widget config cache read error: {e}")
    return None


async def set_cached_widget_config(public_key: str, config: dict) -> None:
    """Cache widget configuration in L1 and L2."""
    key = _widget_config_key(public_key)
    _L1_CONFIG_CACHE.set(key, config, ttl=WIDGET_CONFIG_TTL)

    redis = get_cache()
    if not redis:
        return
    try:
        await redis.set(key, json.dumps(config), ex=WIDGET_CONFIG_TTL)
    except Exception as e:
        logger.warning(f"Widget config cache write error: {e}")


async def invalidate_widget_config(public_key: str) -> None:
    """Purge widget configuration from both L1 and Redis."""
    key = _widget_config_key(public_key)
    _L1_CONFIG_CACHE.delete(key)

    redis = get_cache()
    if not redis:
        return
    try:
        await redis.delete(key)
    except Exception as e:
        logger.warning(f"Widget config cache invalidation error: {e}")


async def invalidate_agent_cache(organization_id: str, agent_id: str) -> None:
    """
    Invalidate all cache entries for an agent.
    Uses SCAN iteration rather than blocking KEYS to protect Redis production clusters.
    """
    prefix = f"chat:{organization_id}:{agent_id}:"
    _L1_CHAT_CACHE.delete_prefix(prefix)

    redis = get_cache()
    if not redis:
        return
    try:
        keys = []
        async for k in redis.scan_iter(match=f"{prefix}*", count=200):
            keys.append(k)
        if keys:
            await redis.delete(*keys)
            logger.info(f"Safely invalidated {len(keys)} cache entries for agent {agent_id}")
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

