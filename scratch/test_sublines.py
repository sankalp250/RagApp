import asyncio
import time
from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.agent import Agent
from backend.app.ai.rag_engine import _get_or_build_index, _bm25_search_inverted, _batch_cosine_similarity, _tokenize
from backend.app.ai.embeddings.service import EmbeddingService
from sqlalchemy import select

async def profile_retrieval():
    async with AsyncSessionLocal() as db:
        agent = (await db.execute(select(Agent).where(Agent.status == 'ACTIVE'))).scalars().first()
        agent_id = str(agent.id)
        org_id = str(agent.organization_id)
        
        # 1. DB load + index build
        t0 = time.monotonic()
        index = await _get_or_build_index(db, agent_id, org_id)
        t1 = time.monotonic()
        print(f"1. Index build / fetch from DB: {(t1 - t0)*1000:.2f}ms (Chunks: {len(index.chunks) if index else 0})")
        
        # 2. Query embedding via provider
        t0 = time.monotonic()
        provider = EmbeddingService.get_provider()
        q_vec = await provider.embed_query("tell me what products u offer")
        t1 = time.monotonic()
        print(f"2. Query embedding ({provider.__class__.__name__}): {(t1 - t0)*1000:.2f}ms")
        
        # 3. Inverted BM25 search
        t0 = time.monotonic()
        query_tokens = _tokenize("tell me what products u offer")
        sparse = _bm25_search_inverted(index, query_tokens)
        t1 = time.monotonic()
        print(f"3. Inverted BM25 Search: {(t1 - t0)*1000:.2f}ms (Hits: {len(sparse)})")
        
        # 4. SIMD dense cosine search
        t0 = time.monotonic()
        scores = _batch_cosine_similarity(q_vec, index.embed_matrix)
        t1 = time.monotonic()
        print(f"4. SIMD Dense Cosine Matrix Multiply: {(t1 - t0)*1000:.2f}ms")

if __name__ == "__main__":
    asyncio.run(profile_retrieval())
