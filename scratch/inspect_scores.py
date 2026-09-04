import asyncio
from backend.app.ai.rag_engine import _get_or_build_index, _batch_cosine_similarity
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.db.session import AsyncSessionLocal

async def check():
    agent_id = "e8826362-9dcb-4177-b830-dd8ebdd09ca5"
    async with AsyncSessionLocal() as db:
        from backend.app.db.models.agent import Agent
        from sqlalchemy import select
        res_a = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = res_a.scalars().first()
        org_id = str(agent.organization_id)
        index = await _get_or_build_index(db, agent_id, org_id)
        provider = EmbeddingService.get_provider()
        qv = await provider.embed_query("What is semantic RAG intelligence?")
        scores = _batch_cosine_similarity(qv, index.embed_matrix)
        for score, chunk in sorted(zip(scores, index.embed_chunks), key=lambda x: x[0], reverse=True):
            meta = chunk.chunk_metadata or {}
            print(f"{score:.4f} | {meta.get('title')} | {chunk.content[:70]}...")

if __name__ == "__main__":
    asyncio.run(check())
