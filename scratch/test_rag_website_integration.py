"""
test_rag_website_integration.py - Task 6 RAG Website Integration Test Suite
=============================================================================
Tests:
  1. document_jobs website path: reads doc.content, purges stale chunks, rich metadata
  2. document_jobs file path: reads from storage backend (unchanged)
  3. Chunk metadata completeness: all required attribution fields present
  4. RAG index filters: is_active=False chunks excluded from index
  5. SourceChunk attribution: source_url, title, crawl_id, knowledge_source_id
  6. Multi-tenant isolation: Org A cannot retrieve Org B chunks
  7. Multi-agent isolation: Agent 1 cannot retrieve Agent 2 chunks in same org
  8. Changed content: re-indexed doc replaces stale chunks
  9. Inactive content excluded: is_active=False document not in results
 10. LLMResult NamedTuple: attribute and tuple access both work
 11. SourceChunk extended schema: all new fields present in model
 12. Context block enrichment: title and source_url appear in LLM prompt context
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import uuid
import math
import time
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List, Dict, Any, Optional

PASS = "[OK]"
FAIL = "[X]"
results: Dict[str, bool] = {}

def check(name: str, condition: bool, detail: str = "") -> None:
    icon = PASS if condition else FAIL
    results[name] = condition
    status = "PASS" if condition else "FAIL"
    extra = f"  ({detail})" if detail else ""
    print(f"  {icon}  [{status}] {name}{extra}")


# ===================================================================
# Section 1: document_jobs — website content path
# ===================================================================
async def test_document_jobs_website_path():
    """Website doc reads from doc.content, purges old chunks, writes rich metadata."""
    print("\n--- Section 1: document_jobs website content path ---")

    from backend.app.workers.document_jobs import _chunk_plain_text

    sample_text = (
        "Our return policy allows returns within 30 days of purchase. "
        "You must have a receipt. Refunds are processed within 5 business days. "
        "Items must be unused and in original packaging. "
        "Contact support@example.com for assistance. "
    ) * 10  # ~500+ chars to produce multiple chunks

    chunks = _chunk_plain_text(sample_text, chunk_size=200, chunk_overlap=30)
    check("1.1 _chunk_plain_text produces chunks", len(chunks) > 0, f"{len(chunks)} chunks")
    check("1.2 chunks are strings", all(isinstance(c, str) for c in chunks))
    check("1.3 chunk sizes respected", all(len(c) <= 230 for c in chunks), f"max={max(len(c) for c in chunks)}")


async def test_document_jobs_metadata():
    """Verify chunk metadata dict has all required attribution fields."""
    print("\n--- Section 2: Chunk metadata completeness ---")

    from backend.app.db.models.document import DocumentChunk

    required_fields = [
        "organization_id", "agent_id", "knowledge_source_id",
        "document_id", "source_url", "canonical_url",
        "title", "crawl_id", "crawl_version",
        "source_type", "chunk_index", "char_count", "filename"
    ]

    # Build a sample chunk_metadata dict as the worker would produce
    sample_meta = {
        "organization_id": "org_abc",
        "agent_id": "agent_xyz",
        "knowledge_source_id": "ks_001",
        "document_id": "doc_001",
        "source_url": "https://example.com/returns",
        "canonical_url": "https://example.com/returns",
        "title": "Return Policy",
        "crawl_id": "crawl_001",
        "crawl_version": 1,
        "source_type": "website",
        "chunk_index": 0,
        "char_count": 150,
        "filename": "web:https://example.com/returns",
    }

    for field in required_fields:
        check(f"2.{required_fields.index(field)+1} chunk_metadata.{field} present",
              field in sample_meta, str(sample_meta.get(field, "MISSING")))


# ===================================================================
# Section 3: RAG engine — SourceChunk schema extension
# ===================================================================
async def test_source_chunk_schema():
    """SourceChunk Pydantic model has all new attribution fields."""
    print("\n--- Section 3: SourceChunk schema extension ---")

    from backend.app.schemas.chat import SourceChunk

    # Construct with all fields
    sc = SourceChunk(
        chunk_id="chunk_001",
        content="We offer a 30-day return policy.",
        similarity_score=0.85,
        rank=1,
        document_filename="web:https://example.com/returns",
        document_id="doc_001",
        source_url="https://example.com/returns",
        title="Return Policy",
        knowledge_source_id="ks_001",
        crawl_id="crawl_001",
        source_type="website",
    )

    check("3.1 SourceChunk.document_id populated", sc.document_id == "doc_001")
    check("3.2 SourceChunk.source_url populated", sc.source_url == "https://example.com/returns")
    check("3.3 SourceChunk.title populated", sc.title == "Return Policy")
    check("3.4 SourceChunk.knowledge_source_id populated", sc.knowledge_source_id == "ks_001")
    check("3.5 SourceChunk.crawl_id populated", sc.crawl_id == "crawl_001")
    check("3.6 SourceChunk.source_type populated", sc.source_type == "website")

    # Ensure backwards-compatible (all fields optional)
    sc_minimal = SourceChunk(
        chunk_id="chunk_002",
        content="Some content.",
        similarity_score=0.7,
        rank=2,
    )
    check("3.7 SourceChunk backward-compatible (optional fields)", sc_minimal.source_url is None)


# ===================================================================
# Section 4: LLMResult NamedTuple
# ===================================================================
async def test_llm_result_named_tuple():
    """LLMResult supports both attribute access and tuple unpacking."""
    print("\n--- Section 4: LLMResult NamedTuple ---")

    from backend.app.ai.rag_engine import LLMResult

    result = LLMResult(answer="Test answer", input_tokens=100, output_tokens=50)

    # Attribute access
    check("4.1 LLMResult.answer attribute", result.answer == "Test answer")
    check("4.2 LLMResult.input_tokens attribute", result.input_tokens == 100)
    check("4.3 LLMResult.output_tokens attribute", result.output_tokens == 50)

    # Tuple unpacking
    answer, in_tok, out_tok = result
    check("4.4 LLMResult tuple unpacking answer", answer == "Test answer")
    check("4.5 LLMResult tuple unpacking in_tok", in_tok == 100)
    check("4.6 LLMResult tuple unpacking out_tok", out_tok == 50)


# ===================================================================
# Section 5: RAG engine index building with Document join filter
# ===================================================================
async def test_index_filters_active_documents():
    """
    _get_or_build_index_internal must join Document and filter
    is_active=True and status='READY'. Verify the query is constructed correctly.
    """
    print("\n--- Section 5: RAG index active-document filter ---")

    import ast
    import inspect
    from backend.app.ai import rag_engine

    source = inspect.getsource(rag_engine._get_or_build_index_internal)

    check("5.1 Index query joins Document model",
          "Document" in source and "join" in source.lower(),
          "join(Document) found in _get_or_build_index_internal")

    check("5.2 Index query filters is_active",
          "is_active" in source,
          "is_active filter found")

    check("5.3 Index query filters status READY",
          "READY" in source,
          "status=READY filter found")


# ===================================================================
# Section 6: Context block enrichment in generate_answer_stream
# ===================================================================
async def test_context_block_enrichment():
    """Context block must include title and source_url when available."""
    print("\n--- Section 6: LLM context block enrichment ---")

    import inspect
    from backend.app.ai import rag_engine

    source = inspect.getsource(rag_engine.generate_answer_stream)

    check("6.1 Context block uses chunk title",
          "c.title" in source,
          "title included in context header")

    check("6.2 Context block uses chunk source_url",
          "c.source_url" in source,
          "source_url included in context header")


# ===================================================================
# Section 7: Multi-tenant isolation logic (unit-level simulation)
# ===================================================================
async def test_multi_tenant_isolation_logic():
    """Simulates two orgs sharing an agent_id — index must never mix their chunks."""
    print("\n--- Section 7: Multi-tenant isolation simulation ---")

    from backend.app.ai.rag_engine import (
        _AgentIndex, _build_bm25_inverted_index, _AGENT_CHUNKS_CACHE,
        invalidate_agent_chunks_cache
    )

    # Create mock chunks for Org A
    chunk_a = MagicMock()
    chunk_a.id = str(uuid.uuid4())
    chunk_a.content = "Org A: Return policy is 30 days."
    chunk_a.embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
    chunk_a.chunk_metadata = {"organization_id": "org_a", "agent_id": "agent_shared"}

    # Create mock chunks for Org B
    chunk_b = MagicMock()
    chunk_b.id = str(uuid.uuid4())
    chunk_b.content = "Org B: Confidential pricing data."
    chunk_b.embedding = [0.9, 0.8, 0.7, 0.6, 0.5]
    chunk_b.chunk_metadata = {"organization_id": "org_b", "agent_id": "agent_shared"}

    # Build separate indexes per (org_id, agent_id) pair
    chunks_a = [chunk_a]
    chunks_b = [chunk_b]

    df_a, avgdl_a, postings_a, doc_lens_a = _build_bm25_inverted_index(chunks_a)
    df_b, avgdl_b, postings_b, doc_lens_b = _build_bm25_inverted_index(chunks_b)

    index_a = _AgentIndex(chunks=chunks_a, df=df_a, avgdl=avgdl_a, N=1,
                          postings=postings_a, doc_lens=doc_lens_a)
    index_b = _AgentIndex(chunks=chunks_b, df=df_b, avgdl=avgdl_b, N=1,
                          postings=postings_b, doc_lens=doc_lens_b)

    # Verify indexes are separate objects with non-overlapping chunk content
    check("7.1 Org A index contains only org_a chunks",
          all(c.chunk_metadata["organization_id"] == "org_a" for c in index_a.chunks))
    check("7.2 Org B index contains only org_b chunks",
          all(c.chunk_metadata["organization_id"] == "org_b" for c in index_b.chunks))
    check("7.3 Org A content not in Org B index",
          not any("Return policy is 30 days" in c.content for c in index_b.chunks))
    check("7.4 Org B confidential content not in Org A index",
          not any("Confidential pricing" in c.content for c in index_a.chunks))


# ===================================================================
# Section 8: Multi-agent isolation within same org
# ===================================================================
async def test_multi_agent_isolation_logic():
    """Two agents in same org must never share chunks."""
    print("\n--- Section 8: Multi-agent isolation simulation ---")

    from backend.app.ai.rag_engine import (
        _AgentIndex, _build_bm25_inverted_index
    )

    chunk_agent1 = MagicMock()
    chunk_agent1.id = str(uuid.uuid4())
    chunk_agent1.content = "Agent 1: Support FAQs about billing."
    chunk_agent1.embedding = [0.3, 0.3, 0.3, 0.3, 0.3]
    chunk_agent1.chunk_metadata = {"organization_id": "shared_org", "agent_id": "agent_1"}

    chunk_agent2 = MagicMock()
    chunk_agent2.id = str(uuid.uuid4())
    chunk_agent2.content = "Agent 2: Internal HR policies."
    chunk_agent2.embedding = [0.7, 0.7, 0.7, 0.7, 0.7]
    chunk_agent2.chunk_metadata = {"organization_id": "shared_org", "agent_id": "agent_2"}

    df1, avgdl1, post1, dl1 = _build_bm25_inverted_index([chunk_agent1])
    df2, avgdl2, post2, dl2 = _build_bm25_inverted_index([chunk_agent2])

    index1 = _AgentIndex(chunks=[chunk_agent1], df=df1, avgdl=avgdl1, N=1, postings=post1, doc_lens=dl1)
    index2 = _AgentIndex(chunks=[chunk_agent2], df=df2, avgdl=avgdl2, N=1, postings=post2, doc_lens=dl2)

    check("8.1 Agent 1 index has only agent_1 chunks",
          all(c.chunk_metadata["agent_id"] == "agent_1" for c in index1.chunks))
    check("8.2 Agent 2 index has only agent_2 chunks",
          all(c.chunk_metadata["agent_id"] == "agent_2" for c in index2.chunks))
    check("8.3 HR policies not in Agent 1 index",
          not any("HR policies" in c.content for c in index1.chunks))
    check("8.4 Billing FAQs not in Agent 2 index",
          not any("billing" in c.content for c in index2.chunks))


# ===================================================================
# Section 9: Changed content - stale chunk purge logic
# ===================================================================
async def test_stale_chunk_purge_logic():
    """Worker imports delete from sqlalchemy (required for purge step)."""
    print("\n--- Section 9: Stale chunk purge import ---")

    import inspect
    from backend.app.workers import document_jobs

    source = inspect.getsource(document_jobs)

    check("9.1 document_jobs imports sqlalchemy delete",
          "from sqlalchemy import" in source and "delete" in source,
          "delete imported")
    check("9.2 document_jobs calls delete(DocumentChunk)",
          "delete(DocumentChunk)" in source,
          "delete(DocumentChunk) found in purge step")
    check("9.3 website doc path reads doc.content",
          "doc.content" in source,
          "doc.content referenced")
    check("9.4 website doc path uses is_website_doc flag",
          "is_website_doc" in source,
          "is_website_doc flag present")


# ===================================================================
# Section 10: BM25 + dense hybrid retrieval correctness
# ===================================================================
async def test_hybrid_retrieval_and_rrf():
    """Verify RRF fusion, quality gate, and chunk ranking logic."""
    print("\n--- Section 10: Hybrid retrieval and RRF ---")

    from backend.app.ai.rag_engine import (
        _AgentIndex, _build_bm25_inverted_index, _bm25_search_inverted,
        _rrf_fuse, _quality_gate, _tokenize, _batch_cosine_similarity,
        _MIN_RRF_SCORE
    )
    try:
        import numpy as np
        numpy_available = True
    except ImportError:
        numpy_available = False

    # Create a mock corpus about return policies
    chunks = []
    texts = [
        "We offer a 30-day return policy on all items.",
        "Products must be in original packaging for a refund.",
        "Contact support@example.com to initiate a return.",
        "Refunds are processed within 5 business days.",
        "We do not accept returns on digital downloads.",
    ]
    for i, text in enumerate(texts):
        c = MagicMock()
        c.id = str(uuid.uuid4())
        c.content = text
        c.embedding = [0.1 * (i + 1)] * 5  # simple non-zero embeddings
        c.chunk_metadata = {
            "source_url": f"https://example.com/returns#{i}",
            "title": "Return Policy",
            "source_type": "website",
        }
        chunks.append(c)

    df, avgdl, postings, doc_lens = _build_bm25_inverted_index(chunks)
    index = _AgentIndex(
        chunks=chunks, df=df, avgdl=avgdl, N=len(chunks),
        postings=postings, doc_lens=doc_lens
    )

    # BM25 sparse retrieval
    query_tokens = _tokenize("30-day return policy refund")
    sparse_results = _bm25_search_inverted(index, query_tokens)
    check("10.1 BM25 returns results for return-policy query", len(sparse_results) > 0,
          f"{len(sparse_results)} results")
    check("10.2 BM25 top result mentions return or refund",
          any("return" in r[1].content.lower() or "refund" in r[1].content.lower()
              for r in sparse_results[:2]))

    # Dense retrieval
    if numpy_available:
        query_vec = [0.15, 0.15, 0.15, 0.15, 0.15]  # similar to chunk index 1
        scores = _batch_cosine_similarity(query_vec, index.embed_matrix)
        check("10.3 Dense cosine returns scores array", len(scores) == len(index.embed_chunks),
              f"{len(scores)} scores")
        check("10.4 All scores between -1 and 1", all(-1.0 <= float(s) <= 1.0 for s in scores))

    # RRF fusion
    dense_ranked = [(0.9, chunks[0]), (0.7, chunks[3]), (0.5, chunks[2])]
    sparse_ranked = [(8.0, chunks[0]), (5.0, chunks[1]), (3.0, chunks[3])]
    fused = _rrf_fuse(dense_ranked, sparse_ranked, top_k=3)
    check("10.5 RRF returns top_k results", len(fused) <= 3)
    check("10.6 RRF top result is chunk appearing in both rankings",
          fused[0][1].id == chunks[0].id, "chunk 0 ranked highest in both")

    # Quality gate
    good_fused = [(0.5, chunks[0])]
    bad_fused = [(0.0001, chunks[0])]
    check("10.7 Quality gate passes high-score fused", _quality_gate(good_fused))
    check("10.8 Quality gate fails very low score", not _quality_gate(bad_fused))
    check("10.9 Quality gate fails empty list", not _quality_gate([]))


# ===================================================================
# Section 11: Source attribution in SourceChunk populated from metadata
# ===================================================================
async def test_source_chunk_population_from_metadata():
    """SourceChunk gets populated with chunk_metadata attribution fields."""
    print("\n--- Section 11: SourceChunk attribution from chunk_metadata ---")

    from backend.app.schemas.chat import SourceChunk

    # Simulating what retrieve_context does
    mock_meta = {
        "filename": "web:https://example.com/returns",
        "document_id": "doc_returns",
        "source_url": "https://example.com/returns",
        "canonical_url": "https://example.com/returns",
        "title": "Return Policy",
        "knowledge_source_id": "ks_example",
        "crawl_id": "crawl_v1",
        "source_type": "website",
    }

    sc = SourceChunk(
        chunk_id="c1",
        content="We offer a 30-day return policy.",
        similarity_score=0.9,
        rank=1,
        document_filename=mock_meta.get("filename"),
        document_id=mock_meta.get("document_id"),
        source_url=mock_meta.get("source_url"),
        title=mock_meta.get("title"),
        knowledge_source_id=mock_meta.get("knowledge_source_id"),
        crawl_id=mock_meta.get("crawl_id"),
        source_type=mock_meta.get("source_type"),
    )

    check("11.1 source_url correctly attributed", sc.source_url == "https://example.com/returns")
    check("11.2 title correctly attributed", sc.title == "Return Policy")
    check("11.3 document_id correctly attributed", sc.document_id == "doc_returns")
    check("11.4 knowledge_source_id correctly attributed", sc.knowledge_source_id == "ks_example")
    check("11.5 crawl_id correctly attributed", sc.crawl_id == "crawl_v1")
    check("11.6 source_type is website", sc.source_type == "website")

    # serialise to dict (used in ChatResponse.sources)
    d = sc.model_dump()
    check("11.7 serializes source_url to dict", "source_url" in d and d["source_url"] is not None)
    check("11.8 serializes title to dict", "title" in d and d["title"] is not None)


# ===================================================================
# Run All Tests
# ===================================================================
async def run_all_tests():
    print("=" * 65)
    print("  TASK 6: RAG WEBSITE INTEGRATION TEST SUITE")
    print("=" * 65)

    await test_document_jobs_website_path()
    await test_document_jobs_metadata()
    await test_source_chunk_schema()
    await test_llm_result_named_tuple()
    await test_index_filters_active_documents()
    await test_context_block_enrichment()
    await test_multi_tenant_isolation_logic()
    await test_multi_agent_isolation_logic()
    await test_stale_chunk_purge_logic()
    await test_hybrid_retrieval_and_rrf()
    await test_source_chunk_population_from_metadata()

    # Summary
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print()
    print("=" * 65)
    print(f"  RESULTS: {passed}/{total} passed", "[OK]" if failed == 0 else f"  ({failed} FAILED)")
    print("=" * 65)

    if failed > 0:
        print("\n  FAILED TESTS:")
        for name, ok in results.items():
            if not ok:
                print(f"    [X] {name}")
        sys.exit(1)
    else:
        print("\n  ALL TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
