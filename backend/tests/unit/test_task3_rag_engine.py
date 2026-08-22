"""
Task 3 Tests: Production RAG Engine
======================================
Tests for: BM25 scoring, RRF fusion, quality gate, query rewriter, and
hybrid retrieval pipeline — all without requiring a live database.
"""
import math
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from backend.app.ai.rag_engine import (
    _tokenize,
    _build_bm25_index,
    _bm25_score,
    _rrf_fuse,
    _quality_gate,
    _MIN_RRF_SCORE,
    _RRF_K,
    _cosine_similarity,
    _AgentIndex,
    invalidate_agent_chunks_cache,
    _AGENT_CHUNKS_CACHE,
)


# ─── Tokenizer ────────────────────────────────────────────────────────────────

def test_tokenize_basic():
    tokens = _tokenize("Hello World! This is a test.")
    assert "hello" in tokens
    assert "world" in tokens
    assert "test" in tokens
    # Single-char and punctuation stripped
    assert "a" not in tokens
    assert "!" not in tokens


def test_tokenize_lowercases():
    tokens = _tokenize("REFUND Policy")
    assert "refund" in tokens
    assert "policy" in tokens


# ─── BM25 ─────────────────────────────────────────────────────────────────────

def _make_chunk(content: str, chunk_id: str = "c1"):
    chunk = MagicMock()
    chunk.id = chunk_id
    chunk.content = content
    chunk.embedding = None
    chunk.chunk_metadata = {"filename": "test.txt"}
    return chunk


def test_bm25_score_hit():
    """Chunk containing query terms should score above zero."""
    chunks = [
        _make_chunk("Our refund policy allows returns within 30 days.", "c1"),
        _make_chunk("The product ships within 3 to 5 business days.", "c2"),
    ]
    df, avgdl = _build_bm25_index(chunks)
    N = len(chunks)
    score = _bm25_score(["refund", "policy"], chunks[0].content, df, avgdl, N)
    assert score > 0.0


def test_bm25_score_miss():
    """Chunk not containing query terms should score zero."""
    chunks = [
        _make_chunk("Our refund policy allows returns within 30 days.", "c1"),
        _make_chunk("The product ships within 3 to 5 business days.", "c2"),
    ]
    df, avgdl = _build_bm25_index(chunks)
    score = _bm25_score(["refund", "policy"], chunks[1].content, df, avgdl, 2)
    assert score == 0.0


def test_bm25_idf_penalizes_common_terms():
    """Common terms across many chunks should score less than rare terms."""
    chunks = [_make_chunk(f"The product {i} ships quickly.", f"c{i}") for i in range(10)]
    chunks.append(_make_chunk("Our unique refund guarantee is exceptional.", "cu"))
    df, avgdl = _build_bm25_index(chunks)
    N = len(chunks)

    score_common = _bm25_score(["the", "product"], chunks[0].content, df, avgdl, N)
    score_rare = _bm25_score(["refund", "guarantee"], chunks[-1].content, df, avgdl, N)
    # Rare terms should produce a higher BM25 IDF contribution
    assert score_rare > score_common


# ─── RRF Fusion ───────────────────────────────────────────────────────────────

def test_rrf_fuse_combines_rankings():
    """Chunks appearing in both rankings should score higher after fusion."""
    c1 = _make_chunk("chunk 1 content", "id1")
    c2 = _make_chunk("chunk 2 content", "id2")
    c3 = _make_chunk("chunk 3 content", "id3")

    dense = [(0.9, c1), (0.7, c2), (0.5, c3)]
    sparse = [(12.0, c2), (8.0, c1), (3.0, c3)]

    fused = _rrf_fuse(dense, sparse, top_k=3)
    ids = [str(chunk.id) for _, chunk in fused]

    # c1 is top-dense, c2 is top-sparse — both should beat c3
    assert "id3" == ids[-1]
    assert set(ids[:2]) == {"id1", "id2"}


def test_rrf_fuse_returns_top_k():
    chunks = [_make_chunk(f"chunk {i}", f"id{i}") for i in range(10)]
    dense = [(1.0 - i * 0.1, c) for i, c in enumerate(chunks)]
    sparse = [(10.0 - i, c) for i, c in enumerate(reversed(chunks))]
    fused = _rrf_fuse(dense, sparse, top_k=3)
    assert len(fused) == 3


# ─── Quality Gate ──────────────────────────────────────────────────────────────

def test_quality_gate_passes_above_threshold():
    chunk = _make_chunk("relevant chunk")
    # RRF score for rank 1 in one retriever = 1/(60+1) ≈ 0.0164 > _MIN_RRF_SCORE
    score = 1.0 / (_RRF_K + 1)
    assert _quality_gate([(score, chunk)]) is True


def test_quality_gate_fails_below_threshold():
    chunk = _make_chunk("marginal chunk")
    # Score below the minimum threshold
    assert _quality_gate([(0.0001, chunk)]) is False


def test_quality_gate_empty_list():
    assert _quality_gate([]) is False


# ─── Cosine Similarity ─────────────────────────────────────────────────────────

def test_cosine_identical_vectors():
    v = [1.0, 0.5, 0.2]
    assert abs(_cosine_similarity(v, v) - 1.0) < 1e-6


def test_cosine_orthogonal_vectors():
    a = [1.0, 0.0, 0.0]
    b = [0.0, 1.0, 0.0]
    assert abs(_cosine_similarity(a, b)) < 1e-6


def test_cosine_empty_vectors():
    assert _cosine_similarity([], []) == 0.0


# ─── Cache Invalidation ────────────────────────────────────────────────────────

def test_invalidate_agent_chunks_cache():
    """invalidate_agent_chunks_cache must remove agent entry from cache."""
    from backend.app.ai.rag_engine import _AGENT_CHUNKS_CACHE, _AgentIndex
    import time

    fake_index = _AgentIndex(
        chunks=[],
        expires_at=time.monotonic() + 300,
        df={},
        avgdl=0.0,
        N=0,
    )
    _AGENT_CHUNKS_CACHE["agent_xyz"] = fake_index
    assert "agent_xyz" in _AGENT_CHUNKS_CACHE

    invalidate_agent_chunks_cache("agent_xyz")
    assert "agent_xyz" not in _AGENT_CHUNKS_CACHE
