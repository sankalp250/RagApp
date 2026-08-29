"""
Rate Limiting Middleware
=========================
Token-bucket rate limiting per:
  - IP address (for public widget endpoints)
  - Organization ID (for authenticated API endpoints extracted from Bearer JWT)

Uses Redis for distributed state with fallback to a bounded thread-safe in-memory LRU store.
"""
import time
from collections import OrderedDict
from threading import Lock
from typing import Tuple, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.logging import logger
from backend.app.core.cache import get_cache
from backend.app.core.security import decode_token


class BoundedMemoryBucket:
    """
    Thread-safe LRU token bucket with bounded capacity.
    Prevents unbounded memory growth / memory leaks when tracking millions of IPs.
    """
    def __init__(self, maxsize: int = 10000):
        self.maxsize = maxsize
        self._buckets: OrderedDict[str, dict] = OrderedDict()
        self._lock = Lock()

    def check(self, key: str, capacity: int, refill_rate: float) -> Tuple[bool, int]:
        now = time.monotonic()
        with self._lock:
            if key in self._buckets:
                bucket = self._buckets[key]
                self._buckets.move_to_end(key)
            else:
                if len(self._buckets) >= self.maxsize:
                    self._buckets.popitem(last=False)  # Evict oldest LRU entry
                bucket = {"tokens": float(capacity), "last_refill": now}
                self._buckets[key] = bucket

            elapsed = now - bucket["last_refill"]
            bucket["tokens"] = min(float(capacity), bucket["tokens"] + elapsed * refill_rate)
            bucket["last_refill"] = now

            if bucket["tokens"] >= 1.0:
                bucket["tokens"] -= 1.0
                return True, int(bucket["tokens"])
            return False, 0


_MEM_BUCKETS = BoundedMemoryBucket(maxsize=10000)


_LUA_TOKEN_BUCKET = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = 1

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if not tokens then
    tokens = capacity
    last_refill = now
else
    local elapsed = math.max(0, now - last_refill)
    tokens = math.min(capacity, tokens + elapsed * refill_rate)
    last_refill = now
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 10)
    return {1, math.floor(tokens)}
else
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 10)
    return {0, math.floor(tokens)}
end
"""


class RateLimiter:
    """
    High-performance token bucket rate limiter supporting atomic distributed Redis Lua script
    and bounded thread-safe in-memory LRU fallback.
    """
    def __init__(self, capacity: int, refill_rate: float, use_redis: bool = True):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.use_redis = use_redis

    async def is_allowed(self, key: str) -> Tuple[bool, int]:
        if self.use_redis:
            redis = get_cache()
            if redis:
                return await self._redis_check(redis, key)
        return _MEM_BUCKETS.check(key, self.capacity, self.refill_rate)

    async def _redis_check(self, redis, key: str) -> Tuple[bool, int]:
        """Atomic O(1) Redis Token Bucket via Lua script."""
        try:
            now = time.time()
            res = await redis.eval(
                _LUA_TOKEN_BUCKET,
                1,
                key,
                self.capacity,
                self.refill_rate,
                now
            )
            allowed = bool(res[0] == 1)
            remaining = int(res[1])
            return allowed, remaining
        except Exception as e:
            logger.debug(f"Redis rate limit check failed, falling back to memory: {e}")
            return _MEM_BUCKETS.check(key, self.capacity, self.refill_rate)


# ─── Rate Limiter Instances (Production-Grade High Capacity) ───────────────────
widget_limiter = RateLimiter(capacity=60, refill_rate=1.0)       # 60 req/min per IP for widget
api_limiter = RateLimiter(capacity=300, refill_rate=5.0)          # 300 req/min per Org
chat_limiter = RateLimiter(capacity=60, refill_rate=1.0)          # 60 req/min per visitor


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies rate limiting based on endpoint type:
    - /api/v1/widget/** → by client IP
    - /api/v1/** (auth) → by organization_id extracted from Bearer JWT
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip rate limiting on OPTIONS preflight and health/docs/asset endpoints
        if request.method == "OPTIONS" or path in {"/health", "/ready", "/docs", "/redoc", "/openapi.json"} or path.startswith("/widget.js"):
            return await call_next(request)

        if "/widget/" in path:
            client_ip = request.client.host if request.client else "unknown"
            key = f"rl:widget:{client_ip}"
            allowed, remaining = await widget_limiter.is_allowed(key)
            limit_capacity = widget_limiter.capacity
        else:
            # Safely extract Org ID or User Sub directly from Authorization Bearer header
            org_id = "anon"
            auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1].strip()
                try:
                    payload = decode_token(token)
                    org_id = payload.get("org_id") or payload.get("sub") or "anon"
                except Exception:
                    org_id = "anon"

            key = f"rl:org:{org_id}"
            allowed, remaining = await api_limiter.is_allowed(key)
            limit_capacity = api_limiter.capacity

        if not allowed:
            logger.warning(f"Rate limit exceeded: {key} on {path}")
            return Response(
                content='{"detail":"Rate limit exceeded. Please slow down."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": "15",
                    "X-RateLimit-Limit": str(limit_capacity),
                    "X-RateLimit-Remaining": "0"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

