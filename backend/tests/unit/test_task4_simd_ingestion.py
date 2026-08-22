"""
Task 4 Tests: SIMD Vector Acceleration & Non-Blocking Worker Ingestion
=======================================================================
Tests for:
  - numpy batch cosine similarity (SIMD path)
  - _AgentIndex pre-normalised matrix construction
  - _embed_chunks_batched concurrent batching
  - _extract_and_chunk pure-function contract
"""
import math
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List

import numpy as np

from backend.app.ai.rag_engine import (
    _cosine_similarity,
    _batch_cosine_similarity,
    _AgentIndex,
    _NUMPY_AVAILABLE,
)
from backend.app.workers.document_jobs import (
    _extract_and_chunk,
    _embed_chunks_batched,
    EMBEDDING_BATCH_SIZE,
)


# ─── SIMD Cosine Similarity ───────────────────────────────────────────────────

def test_numpy_available():
    assert _NUMPY_AVAILABLE is True, "numpy must be installed"


def test_batch_cosine_matches_scalar():
    """_batch_cosine_similarity must produce scores equal to scalar version."""
    import numpy as np

    dim = 128
    rng = np.random.default_rng(42)
    query = rng.random(dim).tolist()
    chunk_vecs = rng.random((20, dim)).tolist()

    # Build pre-normalised matrix (same logic as _AgentIndex)
    raw = np.array(chunk_vecs, dtype=np.float32)
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    matrix = raw / norms

    batch_scores = _batch_cosine_similarity(query, matrix).tolist()
    scalar_scores = [_cosine_similarity(query, v) for v in chunk_vecs]

    for b, s in zip(batch_scores, scalar_scores):
        assert abs(b - s) < 1e-4, f"Mismatch: batch={b:.6f} scalar={s:.6f}"


def test_batch_cosine_zero_query():
    """Zero query vector should return all-zero scores without crash."""
    import numpy as np

    matrix = np.ones((5, 4), dtype=np.float32)
    matrix = matrix / np.linalg.norm(matrix, axis=1, keepdims=True)
    scores = _batch_cosine_similarity([0.0, 0.0, 0.0, 0.0], matrix)
    assert np.all(scores == 0.0)


# ─── _AgentIndex matrix construction ─────────────────────────────────────────

def _make_chunk(content: str, chunk_id: str, embedding: List[float]):
    chunk = MagicMock()
    chunk.id = chunk_id
    chunk.content = content
    chunk.embedding = embedding
    chunk.chunk_metadata = {"filename": "test.txt"}
    return chunk


def test_agent_index_builds_normalised_matrix():
    """_AgentIndex should produce L2-normalised rows in embed_matrix."""
    import numpy as np

    dim = 8
    chunks = [
        _make_chunk(f"chunk {i}", f"id{i}", [float(i + 1)] * dim)
        for i in range(5)
    ]
    index = _AgentIndex(chunks=chunks, expires_at=9999.0, df={}, avgdl=10.0, N=5)

    assert index.embed_matrix is not None
    assert index.embed_matrix.shape == (5, dim)

    # Each row should be unit norm
    row_norms = np.linalg.norm(index.embed_matrix, axis=1)
    assert np.allclose(row_norms, 1.0, atol=1e-5)


def test_agent_index_no_embedding_chunks():
    """Chunks without embeddings should result in empty matrix."""
    chunks = [_make_chunk("no embed", "id0", None)]
    # Override embedding to None
    chunks[0].embedding = None
    index = _AgentIndex(chunks=chunks, expires_at=9999.0, df={}, avgdl=10.0, N=1)
    assert index.embed_matrix is None
    assert index.embed_chunks == []


# ─── Concurrent Embedding Batching ───────────────────────────────────────────

@pytest.mark.asyncio
async def test_embed_chunks_batched_calls_provider():
    """_embed_chunks_batched should call embed_query for every chunk."""
    provider = MagicMock()
    call_count = 0

    async def fake_embed_query(text: str):
        nonlocal call_count
        call_count += 1
        return [0.1] * 4

    provider.embed_query = fake_embed_query

    chunks_text = [f"chunk {i}" for i in range(35)]  # more than one batch
    results = await _embed_chunks_batched(provider, chunks_text, batch_size=EMBEDDING_BATCH_SIZE)

    assert len(results) == 35
    assert call_count == 35  # every chunk got embedded


@pytest.mark.asyncio
async def test_embed_chunks_batched_returns_correct_count():
    """Result list length must equal input list length exactly."""
    provider = MagicMock()

    async def fake_embed_query(text: str):
        return [0.5] * 8

    provider.embed_query = fake_embed_query

    for n in [1, EMBEDDING_BATCH_SIZE, EMBEDDING_BATCH_SIZE + 1, EMBEDDING_BATCH_SIZE * 3]:
        results = await _embed_chunks_batched(provider, [f"t{i}" for i in range(n)], batch_size=EMBEDDING_BATCH_SIZE)
        assert len(results) == n, f"Expected {n} results, got {len(results)}"


# ─── _extract_and_chunk pure function ────────────────────────────────────────

def test_extract_and_chunk_raises_on_empty():
    """Empty file bytes should raise ValueError."""
    with pytest.raises(Exception):
        _extract_and_chunk(b"", "empty.txt", "text/plain")


def test_extract_and_chunk_plain_text():
    """Plain text should produce at least one chunk."""
    content = ("Hello world. " * 100).encode("utf-8")
    chunks, metadata = _extract_and_chunk(content, "test.txt", "text/plain", chunk_size=200, chunk_overlap=20)
    assert len(chunks) >= 1
    assert all(isinstance(c, str) and len(c) > 0 for c in chunks)
