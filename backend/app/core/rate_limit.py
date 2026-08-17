"""
Rate Limiting Middleware
=========================
Token-bucket rate limiting per:
  - IP address (for public widget endpoints)
  - Organization ID (for authenticated API endpoints)

Uses Redis for distributed state. Falls back to in-memory for local dev.

Limits:
  - Widget (anonymous): 30 req/min per IP
  - Authenticated API:  120 req/min per org
  - Chat endpoint:      20 req/min per visitor_id (prevents chat flooding)
"""
import time
import asyncio
from collections import defaultdict
from typing import Optional, Tuple
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.logging import logger
from backend.app.core.cache import get_cache

# ─── In-memory fallback (for local dev without Redis) ─────────────────────────
_memory_buckets: dict = defaultdict(lambda: {"tokens": 0, "last_refill": 0.0})


class RateLimiter:
    """
    Token bucket rate limiter.
    capacity: max tokens (burst allowance)
    refill_rate: tokens per second
    """
    def __init__(self, capacity: int, refill_rate: float, use_redis: bool = True):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.use_redis = use_redis

    async def is_allowed(self, key: str) -> Tuple[bool, int]:
        """
        Returns (allowed: bool, remaining_tokens: int).
        Tries Redis first, falls back to in-memory.
        """
        if self.use_redis:
            redis = get_cache()
            if redis:
                return await self._redis_check(redis, key)
        return self._memory_check(key)

    async def _redis_check(self, redis, key: str) -> Tuple[bool, int]:
        """Redis-based sliding window using sorted sets."""
        try:
            now = time.time()
            window_start = now - (self.capacity / self.refill_rate)
            pipe = redis.pipeline()
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            # Count current entries in window
            pipe.zcard(key)
            # Add new entry
            pipe.zadd(key, {str(now): now})
            # Set TTL
            pipe.expire(key, int(self.capacity / self.refill_rate) + 10)
            results = await pipe.execute()
            count = results[1]
            allowed = count < self.capacity
            remaining = max(0, self.capacity - count - 1)
            return allowed, remaining
        except Exception as e:
            logger.warning(f"Redis rate limit check failed, falling back: {e}")
            return self._memory_check(key)

    def _memory_check(self, key: str) -> Tuple[bool, int]:
        """In-memory token bucket (single-process only)."""
        now = time.time()
        bucket = _memory_buckets[key]
        if bucket["last_refill"] == 0.0:
            bucket["tokens"] = float(self.capacity)
            bucket["last_refill"] = now
        else:
            elapsed = now - bucket["last_refill"]
            bucket["tokens"] = min(
                float(self.capacity),
                bucket["tokens"] + elapsed * self.refill_rate
            )
            bucket["last_refill"] = now

        if bucket["tokens"] >= 1.0:
            bucket["tokens"] -= 1.0
            return True, int(bucket["tokens"])
        return False, 0


# ─── Rate limiter instances ───────────────────────────────────────────────────
widget_limiter = RateLimiter(capacity=30, refill_rate=0.5)        # 30/min per IP
api_limiter = RateLimiter(capacity=120, refill_rate=2.0)           # 120/min per org
chat_limiter = RateLimiter(capacity=20, refill_rate=0.33)          # 20/min per visitor


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies rate limiting based on endpoint type:
    - /api/v1/widget/** → by client IP
    - /api/v1/** (auth) → by organization_id from JWT
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip rate limiting on health/docs endpoints
        if path in {"/health", "/ready", "/docs", "/redoc", "/openapi.json"}:
            return await call_next(request)

        # Determine rate limit key and limiter
        if "/widget/" in path:
            # Public widget: limit by IP
            client_ip = request.client.host if request.client else "unknown"
            key = f"rl:widget:{client_ip}"
            allowed, remaining = await widget_limiter.is_allowed(key)
            limit_type = "widget"
        else:
            # Authenticated API: limit by org (extracted from token if present)
            org_id = getattr(request.state, "organization_id", None) or "anon"
            key = f"rl:api:{org_id}"
            allowed, remaining = await api_limiter.is_allowed(key)
            limit_type = "api"

        if not allowed:
            logger.warning(f"Rate limit exceeded: {key} on {path}")
            return Response(
                content='{"detail":"Rate limit exceeded. Please slow down."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(widget_limiter.capacity if limit_type == "widget" else api_limiter.capacity),
                    "X-RateLimit-Remaining": "0"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
