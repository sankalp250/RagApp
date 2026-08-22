import asyncio
import pytest
from backend.app.core.rate_limit import BoundedMemoryBucket, RateLimiter
from backend.app.core.security import create_access_token


def test_bounded_memory_bucket_lru_eviction():
    """Verify that LRU eviction bounds memory to maxsize without leaks."""
    bucket = BoundedMemoryBucket(maxsize=5)
    
    # Fill 5 entries
    for i in range(5):
        allowed, remaining = bucket.check(f"user_{i}", capacity=10, refill_rate=1.0)
        assert allowed is True

    assert len(bucket._buckets) == 5

    # Access user_0 to make it recently used
    bucket.check("user_0", capacity=10, refill_rate=1.0)

    # Insert user_5 - this should evict user_1 (which was the oldest)
    bucket.check("user_5", capacity=10, refill_rate=1.0)
    assert len(bucket._buckets) == 5
    assert "user_1" not in bucket._buckets
    assert "user_0" in bucket._buckets
    assert "user_5" in bucket._buckets


def test_rate_limiter_token_consumption():
    """Verify rate limiter correctly decrements and blocks when empty."""
    limiter = RateLimiter(capacity=2, refill_rate=0.1, use_redis=False)
    
    # 1st request allowed
    res1, rem1 = _check_sync(limiter, "test_key")
    assert res1 is True
    assert rem1 == 1

    # 2nd request allowed
    res2, rem2 = _check_sync(limiter, "test_key")
    assert res2 is True
    assert rem2 == 0

    # 3rd request blocked
    res3, rem3 = _check_sync(limiter, "test_key")
    assert res3 is False
    assert rem3 == 0


def _check_sync(limiter: RateLimiter, key: str):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(limiter.is_allowed(key))
    finally:
        loop.close()


def test_jwt_org_isolation():
    """Verify different org tokens generate distinct rate limit identities."""
    token_org_a = create_access_token(subject="user_1", organization_id="org_alpha")
    token_org_b = create_access_token(subject="user_2", organization_id="org_beta")

    from backend.app.core.security import decode_token
    payload_a = decode_token(token_org_a)
    payload_b = decode_token(token_org_b)

    assert payload_a["org_id"] == "org_alpha"
    assert payload_b["org_id"] == "org_beta"
    assert payload_a["org_id"] != payload_b["org_id"]
