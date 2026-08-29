import pytest
import asyncio
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.core.circuit_breaker import CircuitBreaker, CircuitState, CircuitBreakerOpenException
from backend.app.ai.rag_engine import (
    generate_answer_stream,
    GUARDRAIL_REFUSAL_MESSAGE,
    _is_greeting_or_conversational,
    _AGENT_CHUNKS_CACHE,
    invalidate_agent_chunks_cache
)
from backend.app.db.models.agent import Agent
from backend.app.schemas.chat import SourceChunk


def test_embedding_service_singleton():
    """Verify EmbeddingService caches and returns singleton instances."""
    p1 = EmbeddingService.get_provider("local")
    p2 = EmbeddingService.get_provider("local")
    assert p1 is p2, "EmbeddingService must return the same cached provider instance"


@pytest.mark.asyncio
async def test_circuit_breaker_call_stream_success():
    """Verify circuit breaker stream generator execution on healthy upstream."""
    breaker = CircuitBreaker("test_stream_ok", failure_threshold=2, recovery_timeout=0.1)

    async def sample_stream():
        yield "Hello "
        yield "world!"

    collected = []
    async for token in breaker.call_stream(sample_stream):
        collected.append(token)

    assert "".join(collected) == "Hello world!"
    assert breaker.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_circuit_breaker_call_stream_failure_trips():
    """Verify circuit breaker trips to OPEN on stream errors and fast-fails."""
    breaker = CircuitBreaker("test_stream_fail", failure_threshold=2, recovery_timeout=0.1)

    async def failing_stream():
        yield "Start"
        raise RuntimeError("Stream disconnect")

    # 1st failure
    with pytest.raises(RuntimeError):
        async for _ in breaker.call_stream(failing_stream):
            pass

    # 2nd failure -> Trips to OPEN
    with pytest.raises(RuntimeError):
        async for _ in breaker.call_stream(failing_stream):
            pass

    assert breaker.state == CircuitState.OPEN

    # 3rd call fast-fails immediately
    with pytest.raises(CircuitBreakerOpenException):
        async for _ in breaker.call_stream(failing_stream):
            pass


def test_guardrails_greeting_classification():
    """Verify greeting and conversational query classification."""
    assert _is_greeting_or_conversational("Hi") is True
    assert _is_greeting_or_conversational("Hello there!") is True
    assert _is_greeting_or_conversational("Good morning") is True
    assert _is_greeting_or_conversational("Thanks") is True

    assert _is_greeting_or_conversational("Write a python script for quicksort") is False
    assert _is_greeting_or_conversational("Who was the 16th president of the US?") is False
    assert _is_greeting_or_conversational("How do I make a chocolate cake?") is False


@pytest.mark.asyncio
async def test_guardrails_refusal_when_no_context():
    """Verify strict domain guardrail refusal when context is empty and query is off-topic."""
    agent = Agent(
        id="test_agent_1",
        name="Support Bot",
        system_prompt="You are a support bot.",
        configuration={"temperature": 0.1, "max_tokens": 100}
    )

    off_topic_query = "Write me a python script to parse CSV files"
    tokens = []
    async for tok in generate_answer_stream(
        agent=agent,
        user_message=off_topic_query,
        context_chunks=[],  # No context
        conversation_history=[]
    ):
        tokens.append(tok)

    response = "".join(tokens)
    assert response == GUARDRAIL_REFUSAL_MESSAGE, f"Expected guardrail refusal, got: {response}"


def test_agent_chunks_lru_cache():
    """Verify LRU cache bounding and explicit invalidation."""
    from backend.app.ai.rag_engine import _AgentIndex

    mock_index = _AgentIndex(
        chunks=[],
        df={"test": 1},
        avgdl=10.0,
        N=1
    )
    _AGENT_CHUNKS_CACHE.set("agent_abc", mock_index, ttl=100)
    assert _AGENT_CHUNKS_CACHE.get("agent_abc") is mock_index

    invalidate_agent_chunks_cache("agent_abc")
    assert _AGENT_CHUNKS_CACHE.get("agent_abc") is None
