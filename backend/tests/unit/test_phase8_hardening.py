import pytest
import asyncio
from backend.app.core.circuit_breaker import CircuitBreaker, CircuitState, CircuitBreakerOpenException
from backend.app.core.rate_limit import RateLimiter
from backend.app.core.cache import _chat_cache_key, _widget_config_key


@pytest.mark.asyncio
async def test_circuit_breaker_success():
    breaker = CircuitBreaker("test_breaker", failure_threshold=2, recovery_timeout=0.1)

    async def sample_success():
        return "ok"

    res = await breaker.call(sample_success)
    assert res == "ok"
    assert breaker.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_circuit_breaker_trips_to_open():
    breaker = CircuitBreaker("test_failing_breaker", failure_threshold=2, recovery_timeout=0.2)

    async def sample_failing():
        raise RuntimeError("API down")

    # First failure
    with pytest.raises(RuntimeError):
        await breaker.call(sample_failing)
    assert breaker.state == CircuitState.CLOSED

    # Second failure -> trips to OPEN
    with pytest.raises(RuntimeError):
        await breaker.call(sample_failing)
    assert breaker.state == CircuitState.OPEN

    # Subsequent call fast-fails immediately with CircuitBreakerOpenException
    with pytest.raises(CircuitBreakerOpenException):
        await breaker.call(sample_failing)


@pytest.mark.asyncio
async def test_circuit_breaker_half_open_recovery():
    breaker = CircuitBreaker("test_recovery", failure_threshold=1, recovery_timeout=0.05)

    async def failing():
        raise RuntimeError("Fail")

    with pytest.raises(RuntimeError):
        await breaker.call(failing)
    assert breaker.state == CircuitState.OPEN

    # Wait for recovery timeout to elapse
    await asyncio.sleep(0.06)

    # Next call should transition to HALF_OPEN and then CLOSED on success
    async def recovered():
        return "success"

    res = await breaker.call(recovered)
    assert res == "success"
    assert breaker.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_rate_limiter_in_memory():
    # Capacity 3, refill rate 0.1 per sec (slow refill for test), in-memory
    limiter = RateLimiter(capacity=3, refill_rate=0.1, use_redis=False)
    key = "test_client_ip_1"

    # First 3 calls should be allowed
    a1, r1 = await limiter.is_allowed(key)
    a2, r2 = await limiter.is_allowed(key)
    a3, r3 = await limiter.is_allowed(key)
    assert a1 and a2 and a3

    # 4th call should be rejected
    a4, r4 = await limiter.is_allowed(key)
    assert not a4


def test_cache_keys():
    k1 = _chat_cache_key("org1", "agent1", "What is the return policy?")
    assert k1.startswith("chat:org1:agent1:")
    k2 = _widget_config_key("public_key_abc")
    assert k2 == "widget:config:public_key_abc"
