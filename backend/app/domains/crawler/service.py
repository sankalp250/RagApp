from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app.db.models.crawler import KnowledgeSource, CrawlJob, CrawlRun, CrawledPage
from backend.app.db.models.agent import Agent
from backend.app.db.base import get_utc_now
from backend.app.schemas.crawler import (
    CreateWebsiteSourceRequest,
    TriggerCrawlRequest,
    KnowledgeSourceResponse,
    CrawlJobResponse,
    CrawlStatusResponse,
    CrawledPageResponse,
    PaginatedCrawledPagesResponse,
    WidgetBootstrapRequest,
    WidgetBootstrapResponse,
    CrawlChangesResponse,
    CrawlChangesSummary,
    CrawlRunsListResponse,
)
from backend.app.core.logging import logger
from backend.app.core.cache import acquire_distributed_lock, release_distributed_lock
from backend.app.workers.queue import job_queue
from backend.app.workers.crawler_jobs import run_crawl_job


class CrawlerService:
    """
    Multi-tenant domain service for managing KnowledgeSources, CrawlJobs, and CrawledPages.
    Guarantees strict tenant isolation by requiring organization_id on all operations.
    """

    @staticmethod
    async def create_website_source(
        db: AsyncSession,
        organization_id: str,
        payload: CreateWebsiteSourceRequest
    ) -> KnowledgeSource:
        """
        Registers or updates a Website KnowledgeSource under the specified Agent.
        Guarantees agent ownership and prevents duplicate sources for the same URL.
        """
        # 1. Verify target Agent belongs to the user's organization
        stmt_agent = select(Agent).where(
            Agent.id == payload.agent_id,
            Agent.organization_id == organization_id
        )
        res_agent = await db.execute(stmt_agent)
        agent = res_agent.scalars().first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent '{payload.agent_id}' not found in your organization."
            )

        # 2. Check for existing knowledge source with same (agent_id, type, url)
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.organization_id == organization_id,
            KnowledgeSource.agent_id == payload.agent_id,
            KnowledgeSource.type == "WEBSITE",
            KnowledgeSource.url == payload.url
        )
        res_source = await db.execute(stmt_source)
        existing_source = res_source.scalars().first()

        config = {
            "max_depth": payload.max_depth or 2,
            "max_pages": payload.max_pages or 50,
            "include_subdomains": payload.include_subdomains or False,
            "match_patterns": payload.match_patterns or [],
            "exclude_patterns": payload.exclude_patterns or [
                "*.pdf", "*.jpg", "*.png", "/cart", "/login", "/checkout"
            ],
        }

        if existing_source:
            # Update existing source configuration
            existing_source.sitemap_url = payload.sitemap_url or existing_source.sitemap_url
            existing_source.name = payload.name or existing_source.name or payload.url
            existing_source.config = config
            existing_source.status = "ACTIVE"
            await db.commit()
            await db.refresh(existing_source)
            logger.info(f"Updated existing KnowledgeSource: {existing_source.id} for agent: {payload.agent_id}")
            return existing_source

        # 3. Create new KnowledgeSource
        source_name = payload.name or payload.url.replace("https://", "").replace("http://", "").split("/")[0]
        new_source = KnowledgeSource(
            organization_id=organization_id,
            agent_id=payload.agent_id,
            type="WEBSITE",
            name=source_name,
            url=payload.url,
            sitemap_url=payload.sitemap_url,
            status="ACTIVE",
            config=config,
        )
        db.add(new_source)
        await db.commit()
        await db.refresh(new_source)
        logger.info(f"Created new KnowledgeSource: {new_source.id} for agent: {payload.agent_id}")
        return new_source

    @staticmethod
    async def trigger_crawl_job(
        db: AsyncSession,
        organization_id: str,
        source_id: str,
        payload: Optional[TriggerCrawlRequest] = None
    ) -> CrawlJob:
        """
        Creates an auditable CrawlJob and marks KnowledgeSource as CRAWLING.
        """
        # 1. Multi-tenant ownership check
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        trigger_type = payload.trigger_type if payload and payload.trigger_type else "MANUAL"
        job_metadata = {}
        if payload and payload.max_pages:
            job_metadata["max_pages_override"] = payload.max_pages

        # 2. Create new CrawlJob in QUEUED status
        crawl_job = CrawlJob(
            organization_id=organization_id,
            agent_id=source.agent_id,
            knowledge_source_id=source.id,
            status="QUEUED",
            trigger_type=trigger_type,
            started_at=get_utc_now(),
            job_metadata=job_metadata,
        )
        db.add(crawl_job)

        # 3. Update source status and audit timestamp
        source.status = "CRAWLING"
        source.last_crawled_at = get_utc_now()

        await db.commit()
        await db.refresh(crawl_job)
        logger.info(f"Queued CrawlJob: {crawl_job.id} for KnowledgeSource: {source_id}")

        # 4. Enqueue background crawl execution
        crawl_job_id = crawl_job.id
        from backend.app.workers.crawler_jobs import run_crawl_job
        job_queue.enqueue(run_crawl_job, crawl_job_id)
        logger.info(f"Dispatched run_crawl_job to background queue: {crawl_job_id}")

        return crawl_job

    @staticmethod
    async def get_website_source(
        db: AsyncSession,
        organization_id: str,
        source_id: str
    ) -> Tuple[KnowledgeSource, int]:
        """
        Fetches KnowledgeSource details with total pages count.
        """
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        # Count total crawled pages
        stmt_count = select(func.count(CrawledPage.id)).where(
            CrawledPage.knowledge_source_id == source_id,
            CrawledPage.organization_id == organization_id
        )
        res_count = await db.execute(stmt_count)
        pages_count = res_count.scalar() or 0

        return source, pages_count

    @staticmethod
    async def get_crawl_status(
        db: AsyncSession,
        organization_id: str,
        source_id: str
    ) -> CrawlStatusResponse:
        """
        Returns the overall crawl status and page counts for a KnowledgeSource.
        """
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        # Find active job (QUEUED or RUNNING)
        stmt_active = select(CrawlJob).where(
            CrawlJob.knowledge_source_id == source_id,
            CrawlJob.organization_id == organization_id,
            CrawlJob.status.in_(["QUEUED", "RUNNING"])
        ).order_by(desc(CrawlJob.created_at))
        res_active = await db.execute(stmt_active)
        active_job = res_active.scalars().first()

        # Find latest completed/failed job
        stmt_latest = select(CrawlJob).where(
            CrawlJob.knowledge_source_id == source_id,
            CrawlJob.organization_id == organization_id
        ).order_by(desc(CrawlJob.created_at))
        res_latest = await db.execute(stmt_latest)
        latest_job = res_latest.scalars().first()

        # Page statistics
        stmt_pages = select(
            CrawledPage.status,
            func.count(CrawledPage.id)
        ).where(
            CrawledPage.knowledge_source_id == source_id,
            CrawledPage.organization_id == organization_id
        ).group_by(CrawledPage.status)
        res_pages = await db.execute(stmt_pages)
        page_counts = dict(res_pages.all())

        discovered_count = page_counts.get("DISCOVERED", 0)
        processed_count = page_counts.get("PROCESSED", 0) + page_counts.get("CRAWLED", 0)
        failed_count = page_counts.get("FAILED", 0)
        total_count = sum(page_counts.values())

        return CrawlStatusResponse(
            knowledge_source_id=source.id,
            organization_id=source.organization_id,
            agent_id=source.agent_id,
            status=source.status,
            url=source.url,
            sitemap_url=source.sitemap_url,
            last_crawled_at=source.last_crawled_at.isoformat() if source.last_crawled_at else None,
            last_successful_crawl_at=source.last_successful_crawl_at.isoformat() if source.last_successful_crawl_at else None,
            total_pages=total_count,
            discovered_pages=discovered_count,
            processed_pages=processed_count,
            failed_pages=failed_count,
            active_job=CrawlJobResponse.model_validate(active_job) if active_job else None,
            latest_job=CrawlJobResponse.model_validate(latest_job) if latest_job else None,
        )

    @staticmethod
    async def list_crawled_pages(
        db: AsyncSession,
        organization_id: str,
        source_id: str,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None
    ) -> PaginatedCrawledPagesResponse:
        """
        Lists paginated crawled pages belonging to a KnowledgeSource with tenant verification.
        """
        # Verify source exists and belongs to org
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        query = select(CrawledPage).where(
            CrawledPage.knowledge_source_id == source_id,
            CrawledPage.organization_id == organization_id
        )
        count_query = select(func.count(CrawledPage.id)).where(
            CrawledPage.knowledge_source_id == source_id,
            CrawledPage.organization_id == organization_id
        )

        if status_filter:
            query = query.where(CrawledPage.status == status_filter.upper())
            count_query = count_query.where(CrawledPage.status == status_filter.upper())

        # Total count
        res_count = await db.execute(count_query)
        total = res_count.scalar() or 0

        # Paginated items
        offset = (page - 1) * page_size
        query = query.order_by(desc(CrawledPage.created_at)).offset(offset).limit(page_size)
        res_items = await db.execute(query)
        items = res_items.scalars().all()

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return PaginatedCrawledPagesResponse(
            items=[
                CrawledPageResponse(
                    id=p.id,
                    organization_id=p.organization_id,
                    agent_id=p.agent_id,
                    knowledge_source_id=p.knowledge_source_id,
                    url=p.url,
                    canonical_url=p.canonical_url,
                    title=p.title,
                    content_hash=p.content_hash,
                    status=p.status,
                    http_status=p.http_status,
                    depth=p.depth or 0,
                    error_message=p.error_message,
                    last_crawled_at=p.last_crawled_at.isoformat() if p.last_crawled_at else None,
                    last_changed_at=p.last_changed_at.isoformat() if p.last_changed_at else None,
                    created_at=p.created_at.isoformat() if p.created_at else None,
                )
                for p in items
            ],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    async def bootstrap_widget(
        db: AsyncSession,
        payload: WidgetBootstrapRequest
    ) -> WidgetBootstrapResponse:
        """
        Public initialization endpoint for the embedded chat widget.

        Security:
          1. Verifies agent exists and is ACTIVE.
          2. Normalizes the incoming origin URL.
          3. Checks if origin matches any KnowledgeSource configured for the agent
             or agent.configuration["allowed_domains"].
          4. Rejects unauthorized origins immediately.

        Idempotency:
          1. If crawl status is COMPLETED or RUNNING or QUEUED -> do not create a new crawl job.
          2. If status is NOT_STARTED -> acquire distributed lock (Redis/Memory) and create
             exactly ONE initial crawl job in QUEUED status.
          3. Concurrent requests during initial crawl receive status="processing" with crawl_triggered=False.
          4. If previous crawl FAILED -> controlled retry (cooldown or force_retry).
        """
        # 1. Look up Agent by ID or public_key
        key = payload.public_key or payload.agent_id
        if not key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'agent_id' or 'public_key' must be provided."
            )

        stmt_agent = select(Agent).where(
            ((Agent.id == key) | (Agent.public_key == key)),
            Agent.status == "ACTIVE"
        )
        res_agent = await db.execute(stmt_agent)
        agent = res_agent.scalars().first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active agent found for key '{key}'."
            )

        config = agent.configuration or {}
        bot_title = config.get("bot_title", "AI Assistant")
        greeting_message = config.get("greeting_message", "Hello! How can I help you today?")
        primary_color = config.get("primary_color", "#2563eb")
        placeholder_text = config.get("placeholder_text", "Ask a question...")
        suggested_questions = config.get("suggested_questions", [])

        # Check if website auto-scraping is disabled by configuration
        auto_crawl_enabled = config.get("auto_crawl_enabled", True)
        if not auto_crawl_enabled:
            return WidgetBootstrapResponse(
                agent_id=str(agent.id),
                public_key=agent.public_key,
                widget_ready=True,
                knowledge_status="ready",
                crawl_triggered=False,
                bot_title=bot_title,
                greeting_message=greeting_message,
                primary_color=primary_color,
                placeholder_text=placeholder_text,
                suggested_questions=suggested_questions,
                message="Website scraping disabled by agent configuration. Running in documents-only mode."
            )

        # 2. Normalize incoming origin
        raw_origin = (payload.origin or getattr(payload, "current_site_origin", None) or "").strip()
        if not raw_origin.startswith(("http://", "https://")):
            raw_origin = f"https://{raw_origin}"

        parsed_origin = urlparse(raw_origin)
        origin_host = (parsed_origin.hostname or "").lower()
        if not origin_host and raw_origin not in ("https://", "http://"):
            return WidgetBootstrapResponse(
                agent_id=str(agent.id),
                public_key=agent.public_key,
                widget_ready=False,
                knowledge_status="unauthorized",
                crawl_triggered=False,
                bot_title=bot_title,
                greeting_message=greeting_message,
                primary_color=primary_color,
                placeholder_text=placeholder_text,
                suggested_questions=suggested_questions,
                error="Invalid origin format."
            )

        # 3. Find matching KnowledgeSource or allowed_domain
        stmt_sources = select(KnowledgeSource).where(
            KnowledgeSource.agent_id == agent.id,
            KnowledgeSource.type == "WEBSITE"
        )
        res_sources = await db.execute(stmt_sources)
        sources = res_sources.scalars().all()

        origin_netloc = (parsed_origin.netloc or "").lower()
        matched_source: Optional[KnowledgeSource] = None
        for s in sources:
            if not s.url:
                continue
            s_parsed = urlparse(s.url)
            s_netloc = (s_parsed.netloc or "").lower()
            s_host = (s_parsed.hostname or "").lower()
            include_subs = s.config.get("include_subdomains", False) if s.config else False
            if origin_netloc == s_netloc or origin_host == s_host or (include_subs and origin_host.endswith(f".{s_host}")):
                matched_source = s
                # Ensure existing source has the correct netloc (including port if present)
                target_url = f"{parsed_origin.scheme}://{parsed_origin.netloc}"
                if parsed_origin.port and s.url != target_url:
                    s.url = target_url
                    await db.commit()
                break

        # Check agent configuration allowed_domains if no source matched
        if not matched_source:
            allowed_domains = config.get("allowed_domains", [])
            domain_allowed = False

            # Auto-allow local development and loopback origins
            if origin_host in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "") or not origin_host:
                domain_allowed = True

            for d in allowed_domains:
                d_clean = d.strip().lower().replace("https://", "").replace("http://", "").rstrip("/")
                if d_clean in ("*", "*.*"):
                    domain_allowed = True
                    break
                elif d_clean.startswith("*."):
                    root = d_clean[2:]
                    if origin_host == root or origin_host.endswith(f".{root}"):
                        domain_allowed = True
                        break
                elif origin_host == d_clean:
                    domain_allowed = True
                    break

            if domain_allowed:
                # Agent explicitly allowed this domain; auto-create a KnowledgeSource
                matched_source = KnowledgeSource(
                    organization_id=agent.organization_id,
                    agent_id=agent.id,
                    type="WEBSITE",
                    name=f"{origin_host} Website",
                    url=f"{parsed_origin.scheme}://{parsed_origin.netloc}",
                    status="ACTIVE",
                    config={"max_depth": 2, "max_pages": 50, "include_subdomains": False}
                )
                db.add(matched_source)
                await db.commit()
                await db.refresh(matched_source)

        if not matched_source:
            return WidgetBootstrapResponse(
                agent_id=str(agent.id),
                public_key=agent.public_key,
                widget_ready=False,
                knowledge_status="unauthorized",
                crawl_triggered=False,
                bot_title=bot_title,
                greeting_message=greeting_message,
                primary_color=primary_color,
                placeholder_text=placeholder_text,
                suggested_questions=suggested_questions,
                error=f"Origin '{raw_origin}' is not authorized for this agent.",
                message="Widget domain mismatch. Please configure allowed domains in your dashboard."
            )

        # 4. Check initial crawl status and evaluate idempotency
        stmt_latest_job = select(CrawlJob).where(
            CrawlJob.knowledge_source_id == matched_source.id
        ).order_by(desc(CrawlJob.created_at))
        res_job = await db.execute(stmt_latest_job)
        latest_job = res_job.scalars().first()

        knowledge_status = "not_started"
        crawl_triggered = False
        crawl_job_id = None
        message = None

        if latest_job:
            crawl_job_id = latest_job.id
            if latest_job.status in ("QUEUED", "RUNNING") or matched_source.status == "CRAWLING":
                # Crawl in progress -> do not duplicate
                knowledge_status = "processing"
                message = "Your knowledge base is still being prepared. Some answers may be limited during initial setup."
            elif latest_job.status == "COMPLETED" or matched_source.last_successful_crawl_at is not None:
                # Crawl completed -> ready
                knowledge_status = "ready"
                message = "Knowledge base ready."
            elif latest_job.status == "FAILED":
                # Check cooldown (300 seconds)
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                cooldown_seconds = 300
                job_time = latest_job.completed_at or latest_job.created_at or now
                elapsed = (now - job_time).total_seconds() if job_time else cooldown_seconds + 1

                if payload.force_retry or elapsed > cooldown_seconds:
                    # Allow retry
                    knowledge_status = "retry_eligible"
                else:
                    knowledge_status = "failed"
                    message = f"Previous website crawl failed. Retry cooldown active ({int(cooldown_seconds - elapsed)}s remaining)."

        # 5. Trigger Initial Crawl if NOT_STARTED or retry_eligible (with distributed lock)
        if knowledge_status in ("not_started", "retry_eligible"):
            lock_key = f"widget_bootstrap_crawl:{matched_source.id}"
            acquired = await acquire_distributed_lock(lock_key, ttl_seconds=60)
            if acquired:
                try:
                    # Double-check inside lock to guarantee atomic creation
                    res_double_check = await db.execute(
                        select(CrawlJob).where(
                            CrawlJob.knowledge_source_id == matched_source.id,
                            CrawlJob.status.in_(["QUEUED", "RUNNING"])
                        )
                    )
                    active_job = res_double_check.scalars().first()
                    if not active_job:
                        new_job = CrawlJob(
                            organization_id=agent.organization_id,
                            agent_id=agent.id,
                            knowledge_source_id=matched_source.id,
                            status="QUEUED",
                            trigger_type="WIDGET_BOOTSTRAP",
                            started_at=get_utc_now(),
                        )
                        db.add(new_job)
                        matched_source.status = "CRAWLING"
                        matched_source.last_crawled_at = get_utc_now()
                        await db.commit()
                        await db.refresh(new_job)

                        # Enqueue background crawl execution
                        job_queue.enqueue(run_crawl_job, new_job.id)
                        crawl_job_id = new_job.id
                        crawl_triggered = True
                        knowledge_status = "processing"
                        message = "Initial website crawl initiated."
                        logger.info(f"[Widget Bootstrap] Triggered initial crawl for agent {agent.id} (job={new_job.id})")
                    else:
                        crawl_job_id = active_job.id
                        knowledge_status = "processing"
                        message = "Your knowledge base is still being prepared. Some answers may be limited during initial setup."
                finally:
                    await release_distributed_lock(lock_key)
            else:
                # Another concurrent request grabbed lock and is triggering the crawl
                knowledge_status = "processing"
                message = "Your knowledge base is still being prepared. Some answers may be limited during initial setup."

        return WidgetBootstrapResponse(
            agent_id=str(agent.id),
            public_key=agent.public_key,
            widget_ready=True,
            knowledge_status=knowledge_status,
            crawl_triggered=crawl_triggered,
            crawl_job_id=crawl_job_id,
            bot_title=bot_title,
            greeting_message=greeting_message,
            primary_color=primary_color,
            placeholder_text=placeholder_text,
            suggested_questions=suggested_questions,
            message=message
        )

    @staticmethod
    async def trigger_recrawl(
        db: AsyncSession,
        organization_id: str,
        source_id: str,
        payload: Optional[TriggerCrawlRequest] = None
    ) -> CrawlJob:
        """
        Triggers an incremental re-crawl for an existing website KnowledgeSource.
        Prevents duplicate concurrent crawls and maintains historical run records.
        """
        # 1. Multi-tenant ownership check
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found in your organization."
            )

        # 2. Check if a crawl is already running or queued
        stmt_active = select(CrawlJob).where(
            CrawlJob.knowledge_source_id == source_id,
            CrawlJob.status.in_(["QUEUED", "RUNNING"])
        )
        res_active = await db.execute(stmt_active)
        active_job = res_active.scalars().first()
        if active_job:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A crawl job ({active_job.id}) is already in progress ({active_job.status}) for this website."
            )

        # 3. Distributed lock protection against race condition triggers
        lock_key = f"recrawl:{source.id}"
        acquired = await acquire_distributed_lock(lock_key, ttl_seconds=60)
        if not acquired:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A re-crawl request is currently being dispatched for this website."
            )

        try:
            job_metadata = {}
            if payload and payload.max_pages:
                job_metadata["max_pages_override"] = payload.max_pages

            # 4. Create new CrawlJob in QUEUED status with trigger_type="RECRAWL"
            target_version = (source.current_version or 1) + 1 if source.last_successful_crawl_at else (source.current_version or 1)
            crawl_job = CrawlJob(
                organization_id=organization_id,
                agent_id=source.agent_id,
                knowledge_source_id=source.id,
                status="QUEUED",
                trigger_type="RECRAWL",
                crawl_version=target_version,
                started_at=get_utc_now(),
                job_metadata=job_metadata,
            )
            db.add(crawl_job)

            # 5. Update source status and audit timestamp
            source.status = "CRAWLING"
            source.last_crawled_at = get_utc_now()

            await db.commit()
            await db.refresh(crawl_job)
            logger.info(f"Queued incremental re-crawl job: {crawl_job.id} (v{target_version}) for source: {source_id}")

            # 6. Enqueue background execution
            job_queue.enqueue(run_crawl_job, crawl_job.id)
            return crawl_job
        finally:
            await release_distributed_lock(lock_key)

    @staticmethod
    async def list_crawl_runs(
        db: AsyncSession,
        organization_id: str,
        source_id: str
    ) -> CrawlRunsListResponse:
        """
        Lists all auditable crawl runs for a website KnowledgeSource with breakdown metrics.
        """
        # Multi-tenant ownership check
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        stmt_jobs = select(CrawlJob).where(
            CrawlJob.knowledge_source_id == source_id,
            CrawlJob.organization_id == organization_id
        ).order_by(desc(CrawlJob.created_at))
        res_jobs = await db.execute(stmt_jobs)
        jobs = res_jobs.scalars().all()

        return CrawlRunsListResponse(
            knowledge_source_id=source_id,
            total_runs=len(jobs),
            runs=[CrawlJobResponse.model_validate(j) for j in jobs]
        )

    @staticmethod
    async def get_crawl_changes(
        db: AsyncSession,
        organization_id: str,
        source_id: str,
        job_id: Optional[str] = None
    ) -> CrawlChangesResponse:
        """
        Returns categorized change lists (New, Changed, Removed, Unchanged) for dashboard display.
        """
        # Multi-tenant ownership check
        stmt_source = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id
        )
        res_source = await db.execute(stmt_source)
        source = res_source.scalars().first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KnowledgeSource '{source_id}' not found."
            )

        # Target job
        if job_id:
            stmt_job = select(CrawlJob).where(
                CrawlJob.id == job_id,
                CrawlJob.knowledge_source_id == source_id,
                CrawlJob.organization_id == organization_id
            )
        else:
            stmt_job = select(CrawlJob).where(
                CrawlJob.knowledge_source_id == source_id,
                CrawlJob.organization_id == organization_id
            ).order_by(desc(CrawlJob.created_at))

        res_job = await db.execute(stmt_job)
        target_job = res_job.scalars().first()

        # Query all pages for this source
        stmt_pages = select(CrawledPage).where(
            CrawledPage.knowledge_source_id == source_id,
            CrawledPage.organization_id == organization_id
        ).order_by(desc(CrawledPage.last_changed_at))
        res_pages = await db.execute(stmt_pages)
        pages = res_pages.scalars().all()

        new_pages = [CrawledPageResponse.model_validate(p) for p in pages if p.change_status == "NEW"]
        changed_pages = [CrawledPageResponse.model_validate(p) for p in pages if p.change_status == "CHANGED"]
        removed_pages = [CrawledPageResponse.model_validate(p) for p in pages if p.change_status == "REMOVED" or not p.is_active]
        unchanged_pages = [CrawledPageResponse.model_validate(p) for p in pages if p.change_status == "UNCHANGED" and p.is_active]

        return CrawlChangesResponse(
            knowledge_source_id=source_id,
            crawl_job_id=target_job.id if target_job else None,
            crawl_version=target_job.crawl_version if target_job else (source.current_version or 1),
            summary=CrawlChangesSummary(
                new_count=len(new_pages),
                changed_count=len(changed_pages),
                removed_count=len(removed_pages),
                unchanged_count=len(unchanged_pages),
                total_pages=len(pages),
            ),
            new_pages=new_pages,
            changed_pages=changed_pages,
            removed_pages=removed_pages,
            unchanged_pages=unchanged_pages,
        )


