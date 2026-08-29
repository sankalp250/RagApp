"""
crawler_jobs.py — Background Worker for Website Crawl Jobs
===========================================================
Implements the async background task that drives one CrawlJob from
QUEUED → RUNNING → COMPLETED / FAILED.

Called by:
    job_queue.enqueue(run_crawl_job, crawl_job_id)

Lifecycle:
    1. Load CrawlJob + KnowledgeSource from DB
    2. Transition CrawlJob status: QUEUED → RUNNING
    3. Instantiate and run WebsiteCrawler.crawl()
    4. Persist audit counters (pages_discovered, pages_processed, pages_failed)
    5. Transition KnowledgeSource status: CRAWLING → ACTIVE (or FAILED)
    6. Transition CrawlJob status: RUNNING → COMPLETED / FAILED / PARTIAL

Error handling:
    - Any unhandled exception during crawl marks the job FAILED and records
      the error_summary on the CrawlJob row.
    - Individual page failures are handled inside WebsiteCrawler and do NOT
      bubble up to cancel the whole job.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select

from backend.app.core.logging import logger
from backend.app.db.models.crawler import CrawlJob, KnowledgeSource
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.crawler.engine import WebsiteCrawler


async def run_crawl_job(crawl_job_id: str) -> None:
    """
    Primary background job function.
    Loads the CrawlJob, runs the WebsiteCrawler, and persists results.
    """
    logger.info(f"[run_crawl_job] Starting crawl_job_id={crawl_job_id}")

    async with AsyncSessionLocal() as db:
        # Load job + source
        job_result = await db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        crawl_job: Optional[CrawlJob] = job_result.scalars().first()

        if not crawl_job:
            logger.error(f"[run_crawl_job] CrawlJob not found: {crawl_job_id}")
            return

        if crawl_job.status not in ("QUEUED", "RUNNING"):
            logger.warning(
                f"[run_crawl_job] Job {crawl_job_id} already in terminal state "
                f"({crawl_job.status}) — skipping."
            )
            return

        source_result = await db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.id == crawl_job.knowledge_source_id
            )
        )
        source: Optional[KnowledgeSource] = source_result.scalars().first()

        if not source:
            logger.error(
                f"[run_crawl_job] KnowledgeSource not found for job {crawl_job_id}"
            )
            crawl_job.status = "FAILED"
            crawl_job.error_summary = "KnowledgeSource record not found."
            await db.commit()
            return

        # Determine target version
        target_version = source.current_version or 1
        if crawl_job.trigger_type == "RECRAWL" and source.last_successful_crawl_at is not None:
            target_version += 1

        # Transition to RUNNING
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        crawl_job.status = "RUNNING"
        crawl_job.started_at = now
        crawl_job.crawl_version = target_version
        source.status = "CRAWLING"
        await db.commit()

    # Run the crawler (outside the DB session to avoid long-held connections)
    stats = None
    error_summary: Optional[str] = None

    try:
        crawler = WebsiteCrawler(
            crawl_job_id=crawl_job_id,
            knowledge_source_id=crawl_job.knowledge_source_id,
            organization_id=crawl_job.organization_id,
            agent_id=crawl_job.agent_id,
            root_url=source.url,
            config=source.config or {},
            crawl_version=target_version,
        )
        stats = await crawler.crawl()

    except Exception as exc:
        logger.error(
            f"[run_crawl_job] Crawler raised unhandled exception for job {crawl_job_id}: {exc}",
            exc_info=True,
        )
        error_summary = f"{type(exc).__name__}: {exc}"

    # Persist final status
    async with AsyncSessionLocal() as db:
        job_result = await db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        crawl_job = job_result.scalars().first()

        source_result = await db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.id == crawl_job.knowledge_source_id
            )
        )
        source = source_result.scalars().first()

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        crawl_job.completed_at = now

        if error_summary:
            crawl_job.status = "FAILED"
            crawl_job.error_summary = error_summary
            if source:
                source.status = "FAILED"
        elif stats:
            crawl_job.pages_discovered = stats.pages_discovered
            crawl_job.pages_processed = stats.pages_processed
            crawl_job.pages_failed = stats.pages_failed
            crawl_job.pages_unchanged = stats.pages_unchanged
            crawl_job.pages_changed = stats.pages_changed
            crawl_job.pages_new = stats.pages_new
            crawl_job.pages_removed = stats.pages_removed
            crawl_job.crawl_version = target_version

            if stats.pages_failed > 0 and stats.pages_processed == 0 and stats.pages_unchanged == 0:
                crawl_job.status = "FAILED"
                if source:
                    source.status = "FAILED"
            elif stats.pages_failed > 0:
                crawl_job.status = "PARTIAL"
                if source:
                    source.status = "ACTIVE"
                    source.current_version = target_version
                    source.last_crawled_at = now
                    source.last_successful_crawl_at = now
            else:
                crawl_job.status = "COMPLETED"
                if source:
                    source.status = "ACTIVE"
                    source.current_version = target_version
                    source.last_crawled_at = now
                    source.last_successful_crawl_at = now
        else:
            crawl_job.status = "FAILED"
            crawl_job.error_summary = "Crawler returned no stats."
            if source:
                source.status = "FAILED"

        await db.commit()

    logger.info(
        f"[run_crawl_job] Job {crawl_job_id} (v{target_version}) finished: "
        f"status={crawl_job.status}, "
        f"discovered={getattr(stats, 'pages_discovered', 0)}, "
        f"new={getattr(stats, 'pages_new', 0)}, "
        f"changed={getattr(stats, 'pages_changed', 0)}, "
        f"unchanged={getattr(stats, 'pages_unchanged', 0)}, "
        f"removed={getattr(stats, 'pages_removed', 0)}, "
        f"failed={getattr(stats, 'pages_failed', 0)}"
    )
