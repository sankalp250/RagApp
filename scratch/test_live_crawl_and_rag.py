import asyncio
import sys
from sqlalchemy import select

from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.crawler.service import CrawlerService
from backend.app.workers.crawler_jobs import run_crawl_job
from backend.app.db.models.crawler import KnowledgeSource, CrawlJob, CrawledPage
from backend.app.db.models.document import Document, DocumentChunk
from backend.app.domains.chat.service import ChatService
from backend.app.schemas.chat import ChatRequest

async def main():
    agent_id = "e8826362-9dcb-4177-b830-dd8ebdd09ca5"
    print("=== LIVE CRAWL & RAG VERIFICATION ===")

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.agent_id == agent_id,
                KnowledgeSource.type == "WEBSITE"
            )
        )
        ks = res.scalars().first()
        if not ks:
            print("ERROR: No website knowledge source found for agent")
            return

        print(f"KnowledgeSource ID: {ks.id}, current url: {ks.url}")
        ks.url = "http://127.0.0.1:8000"
        await db.commit()

        # Trigger crawl
        job = await CrawlerService.trigger_crawl_job(db, ks.organization_id, ks.id)
        print(f"Triggered CrawlJob: {job.id}")

    # Run the crawl job synchronously
    await run_crawl_job(job.id)
    print("Crawl job execution finished!")

    # Wait 2 seconds for document embedding background worker to finish
    await asyncio.sleep(2.0)

    async with AsyncSessionLocal() as db:
        res_job = await db.execute(select(CrawlJob).where(CrawlJob.id == job.id))
        fresh_job = res_job.scalars().first()
        print(f"CrawlJob status: {fresh_job.status}")
        print(f"Pages discovered: {fresh_job.pages_discovered}, processed: {fresh_job.pages_processed}")

        # Check CrawledPage
        res_pages = await db.execute(
            select(CrawledPage).where(CrawledPage.knowledge_source_id == ks.id)
        )
        pages = res_pages.scalars().all()
        for p in pages:
            print(f"CrawledPage: url={p.url}, status={p.status}, change={p.change_status}, title={p.title}")

        # Check Document & chunks
        res_docs = await db.execute(
            select(Document).where(Document.knowledge_source_id == ks.id)
        )
        docs = res_docs.scalars().all()
        for d in docs:
            print(f"Document: id={d.id}, url={d.source_url}, status={d.status}, chunks={d.chunk_count}")

            res_chunks = await db.execute(
                select(DocumentChunk).where(DocumentChunk.document_id == d.id)
            )
            chunks = res_chunks.scalars().all()
            for c in chunks:
                if "semantic" in c.content.lower():
                    print(f"-> Found Semantic RAG chunk! (index={c.chunk_index}):\n{c.content[:200]}...")

    # Test Query 1: "What is semantic RAG intelligence?"
    print("\n--- Testing RAG Query 1: 'What is semantic RAG intelligence?' ---")
    req1 = ChatRequest(
        message="What is semantic RAG intelligence?",
        visitor_id="test_live_visitor"
    )
    async with AsyncSessionLocal() as db:
        resp1 = await ChatService.chat(
            db=db,
            agent_id=agent_id,
            organization_id=ks.organization_id,
            request=req1
        )
    print("Answer 1:\n", resp1.answer)
    print("Sources 1 count:", len(resp1.sources))
    for s in resp1.sources:
        print(f"  - [{s.title}] ({s.source_url}) score={s.similarity_score:.3f}")

    # Test Query 2: Off-topic question -> should refuse with ZERO citations
    print("\n--- Testing RAG Query 2: Off-topic ('Who was Napoleon Bonaparte?') ---")
    req2 = ChatRequest(
        message="Who was Napoleon Bonaparte?",
        visitor_id="test_live_visitor"
    )
    async with AsyncSessionLocal() as db:
        resp2 = await ChatService.chat(
            db=db,
            agent_id=agent_id,
            organization_id=ks.organization_id,
            request=req2
        )
    print("Answer 2:\n", resp2.answer)
    print("Sources 2 count (must be 0):", len(resp2.sources))

if __name__ == "__main__":
    asyncio.run(main())
