import asyncio
import time
from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.agent import Agent
from backend.app.domains.chat.service import ChatService
from backend.app.schemas.chat import ChatRequest
from backend.app.ai.rag_engine import retrieve_context, _rewrite_query, _get_or_build_index
from backend.app.ai.embeddings.service import EmbeddingService
from sqlalchemy import select

async def benchmark_chat():
    async with AsyncSessionLocal() as db:
        agent = (await db.execute(select(Agent).where(Agent.status == 'ACTIVE'))).scalars().first()
        if not agent:
            print('No active agent found')
            return
        
        agent_id = str(agent.id)
        org_id = str(agent.organization_id)
        print(f'Benchmarking Agent: {agent.name} ({agent_id}), Model: {agent.model}')
        
        query = 'tell me what products u offer'
        
        # Test 1: Smart Query Rewriting Gate
        t_rw0 = time.monotonic()
        rw = await _rewrite_query(query, [])
        t_rw1 = time.monotonic()
        print(f'1. Query rewriting (Smart Gate): {(t_rw1 - t_rw0)*1000:.2f}ms -> "{rw}"')
        
        # Test 2: Inverted BM25 + SIMD Vector Retrieval
        t_ret0 = time.monotonic()
        sources, raw = await retrieve_context(db, agent_id, org_id, query)
        t_ret1 = time.monotonic()
        print(f'2. Inverted Hybrid Retrieval total: {(t_ret1 - t_ret0)*1000:.2f}ms, found {len(sources)} chunks')

    req = ChatRequest(
        message=query,
        visitor_id='bench_visitor_' + str(time.time()),
        stream=True
    )
    
    t0 = time.monotonic()
    first_token_time = None
    token_count = 0
    
    print('\nStarting full ChatService.chat_stream...')
    async for event in ChatService.chat_stream(agent_id=agent_id, organization_id=org_id, request=req):
        now = time.monotonic()
        ev_type = event.get('event')
        if ev_type == 'meta':
            print(f'[{(now - t0)*1000:.1f}ms] META event: sources count = {len(event.get("sources", []))}')
        elif ev_type == 'token':
            if first_token_time is None:
                first_token_time = (now - t0) * 1000
                print(f'>>> [TTFT: {first_token_time:.1f}ms] FIRST TOKEN RECEIVED!')
            token_count += 1
        elif ev_type == 'done':
            print(f'[{(now - t0)*1000:.1f}ms] DONE event! Total tokens: {token_count}')
            
    print(f'Total end-to-end stream time: {(time.monotonic() - t0)*1000:.1f}ms')

if __name__ == '__main__':
    asyncio.run(benchmark_chat())
