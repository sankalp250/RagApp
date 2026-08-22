import time
import pytest
from backend.app.core.cache import (
    LRUTtlCache,
    _chat_cache_key,
    _widget_config_key,
    get_cached_chat,
    set_cached_chat,
    get_cached_widget_config,
    set_cached_widget_config,
    invalidate_agent_cache,
    invalidate_widget_config,
    clear_all_caches,
)
from backend.app.ai.rag_engine import invalidate_agent_chunks_cache, _AGENT_CHUNKS_CACHE


def test_lru_ttl_cache_eviction_and_expiry():
    """Verify LRUTtlCache respects capacity and monotonic TTL expiration."""
    cache = LRUTtlCache(maxsize=3)

    # Add 3 entries
    cache.set("key1", "val1", ttl=100.0)
    cache.set("key2", "val2", ttl=100.0)
    cache.set("key3", "val3", ttl=100.0)

    assert cache.get("key1") == "val1"
    assert cache.get("key2") == "val2"
    assert cache.get("key3") == "val3"

    # Access key1 to make it most-recently-used (key2 becomes oldest)
    cache.get("key1")

    # Add 4th entry -> should evict key2
    cache.set("key4", "val4", ttl=100.0)
    assert cache.get("key2") is None
    assert cache.get("key1") == "val1"
    assert cache.get("key3") == "val3"
    assert cache.get("key4") == "val4"


def test_lru_ttl_cache_prefix_deletion():
    """Verify prefix deletion purges all scoped keys."""
    cache = LRUTtlCache(maxsize=10)
    cache.set("chat:org1:agentA:q1", "ans1", ttl=100.0)
    cache.set("chat:org1:agentA:q2", "ans2", ttl=100.0)
    cache.set("chat:org1:agentB:q1", "ans3", ttl=100.0)
    cache.set("chat:org2:agentA:q1", "ans4", ttl=100.0)

    cache.delete_prefix("chat:org1:agentA:")

    assert cache.get("chat:org1:agentA:q1") is None
    assert cache.get("chat:org1:agentA:q2") is None
    assert cache.get("chat:org1:agentB:q1") == "ans3"
    assert cache.get("chat:org2:agentA:q1") == "ans4"


def test_lru_ttl_cache_expired_entry():
    """Verify expired entries are not returned and are removed."""
    cache = LRUTtlCache(maxsize=10)
    # Set with negative TTL (already expired)
    cache.set("expired_key", "old_val", ttl=-1.0)
    assert cache.get("expired_key") is None


@pytest.mark.asyncio
async def test_multi_tier_chat_cache_and_invalidation():
    """Verify set_cached_chat and invalidate_agent_cache flow."""
    org_id = "test_org_100"
    agent_id = "test_agent_200"
    query = "How do refunds work?"
    resp_data = {"answer": "Refunds are processed in 5-7 days.", "sources": []}

    await set_cached_chat(org_id, agent_id, query, resp_data, ttl=60)
    cached = await get_cached_chat(org_id, agent_id, query)
    assert cached is not None
    assert cached["answer"] == resp_data["answer"]

    # Invalidate agent cache
    await invalidate_agent_cache(org_id, agent_id)
    cleared = await get_cached_chat(org_id, agent_id, query)
    assert cleared is None


@pytest.mark.asyncio
async def test_widget_config_cache_and_invalidation():
    """Verify widget config caching and invalidation."""
    public_key = "pub_key_test_123"
    cfg = {"bot_title": "Support Bot", "primary_color": "#10b981"}

    await set_cached_widget_config(public_key, cfg)
    cached = await get_cached_widget_config(public_key)
    assert cached is not None
    assert cached["bot_title"] == "Support Bot"

    await invalidate_widget_config(public_key)
    cleared = await get_cached_widget_config(public_key)
    assert cleared is None
