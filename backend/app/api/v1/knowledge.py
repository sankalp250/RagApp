from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, get_current_user
from backend.app.db.models.user import User
from backend.app.schemas.crawler import (
    CreateWebsiteSourceRequest,
    TriggerCrawlRequest,
    KnowledgeSourceResponse,
    CrawlJobResponse,
    CrawlStatusResponse,
    PaginatedCrawledPagesResponse,
    CrawlRunsListResponse,
    CrawlChangesResponse,
)
from backend.app.domains.crawler.service import CrawlerService

router = APIRouter()


@router.post(
    "/websites",
    response_model=KnowledgeSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a website knowledge source for an Agent"
)
async def create_website_source(
    payload: CreateWebsiteSourceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a new Website / Sitemap knowledge source under an agent.
    Enforces multi-tenant data boundaries and prevents duplicate active sources.
    """
    source = await CrawlerService.create_website_source(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload
    )
    return KnowledgeSourceResponse(
        id=source.id,
        organization_id=source.organization_id,
        agent_id=source.agent_id,
        type=source.type,
        name=source.name,
        url=source.url,
        sitemap_url=source.sitemap_url,
        status=source.status,
        config=source.config or {},
        last_crawled_at=source.last_crawled_at.isoformat() if source.last_crawled_at else None,
        last_successful_crawl_at=source.last_successful_crawl_at.isoformat() if source.last_successful_crawl_at else None,
        created_at=source.created_at.isoformat() if source.created_at else None,
        updated_at=source.updated_at.isoformat() if source.updated_at else None,
        total_pages_count=0
    )


@router.post(
    "/websites/{id}/crawl",
    response_model=CrawlJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger an auditable crawl job for a website knowledge source"
)
async def trigger_website_crawl(
    id: str,
    payload: Optional[TriggerCrawlRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enqueues an asynchronous crawl job for the registered website source.
    Creates an immutable audit log entry in crawl_jobs.
    """
    crawl_job = await CrawlerService.trigger_crawl_job(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id,
        payload=payload
    )
    return CrawlJobResponse(
        id=crawl_job.id,
        organization_id=crawl_job.organization_id,
        agent_id=crawl_job.agent_id,
        knowledge_source_id=crawl_job.knowledge_source_id,
        status=crawl_job.status,
        trigger_type=crawl_job.trigger_type,
        started_at=crawl_job.started_at.isoformat() if crawl_job.started_at else None,
        completed_at=crawl_job.completed_at.isoformat() if crawl_job.completed_at else None,
        pages_discovered=crawl_job.pages_discovered or 0,
        pages_processed=crawl_job.pages_processed or 0,
        pages_failed=crawl_job.pages_failed or 0,
        error_summary=crawl_job.error_summary,
        created_at=crawl_job.created_at.isoformat() if crawl_job.created_at else None,
    )


@router.get(
    "/websites/{id}",
    response_model=KnowledgeSourceResponse,
    summary="Get details of a website knowledge source"
)
async def get_website_source(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves knowledge source metadata, configuration, and total indexed page count.
    """
    source, pages_count = await CrawlerService.get_website_source(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id
    )
    return KnowledgeSourceResponse(
        id=source.id,
        organization_id=source.organization_id,
        agent_id=source.agent_id,
        type=source.type,
        name=source.name,
        url=source.url,
        sitemap_url=source.sitemap_url,
        status=source.status,
        config=source.config or {},
        last_crawled_at=source.last_crawled_at.isoformat() if source.last_crawled_at else None,
        last_successful_crawl_at=source.last_successful_crawl_at.isoformat() if source.last_successful_crawl_at else None,
        created_at=source.created_at.isoformat() if source.created_at else None,
        updated_at=source.updated_at.isoformat() if source.updated_at else None,
        total_pages_count=pages_count
    )


@router.get(
    "/websites/{id}/status",
    response_model=CrawlStatusResponse,
    summary="Get real-time crawl job progress and page statistics"
)
async def get_website_crawl_status(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns progress statistics (pages discovered, processed, failed) and active crawl job info.
    """
    return await CrawlerService.get_crawl_status(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id
    )


@router.get(
    "/websites/{id}/pages",
    response_model=PaginatedCrawledPagesResponse,
    summary="List paginated crawled pages belonging to a website knowledge source"
)
async def list_website_crawled_pages(
    id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: DISCOVERED, CRAWLED, PROCESSED, FAILED"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns paginated crawled URLs, canonical URLs, titles, HTTP status codes, and content hashes.
    """
    return await CrawlerService.list_crawled_pages(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id,
        page=page,
        page_size=page_size,
        status_filter=status
    )


@router.post(
    "/websites/{id}/recrawl",
    response_model=CrawlJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger incremental re-crawl when website changes"
)
async def trigger_website_recrawl(
    id: str,
    payload: Optional[TriggerCrawlRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an incremental re-crawl for an existing website knowledge source.
    Only new and modified pages are re-embedded; unchanged embeddings are preserved.
    """
    crawl_job = await CrawlerService.trigger_recrawl(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id,
        payload=payload
    )
    return CrawlJobResponse(
        id=crawl_job.id,
        organization_id=crawl_job.organization_id,
        agent_id=crawl_job.agent_id,
        knowledge_source_id=crawl_job.knowledge_source_id,
        status=crawl_job.status,
        trigger_type=crawl_job.trigger_type,
        started_at=crawl_job.started_at.isoformat() if crawl_job.started_at else None,
        completed_at=crawl_job.completed_at.isoformat() if crawl_job.completed_at else None,
        pages_discovered=crawl_job.pages_discovered or 0,
        pages_processed=crawl_job.pages_processed or 0,
        pages_failed=crawl_job.pages_failed or 0,
        pages_unchanged=crawl_job.pages_unchanged or 0,
        pages_changed=crawl_job.pages_changed or 0,
        pages_new=crawl_job.pages_new or 0,
        pages_removed=crawl_job.pages_removed or 0,
        crawl_version=crawl_job.crawl_version or 1,
        error_summary=crawl_job.error_summary,
        created_at=crawl_job.created_at.isoformat() if crawl_job.created_at else None,
    )


@router.get(
    "/websites/{id}/runs",
    response_model=CrawlRunsListResponse,
    summary="List all historical crawl runs with change metrics for a website"
)
async def list_website_crawl_runs(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns an auditable list of all crawl runs with discovered, changed, new, and removed page metrics.
    """
    return await CrawlerService.list_crawl_runs(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id
    )


@router.get(
    "/websites/{id}/changes",
    response_model=CrawlChangesResponse,
    summary="Get categorized change report (New, Changed, Removed, Unchanged) for dashboard"
)
async def get_website_crawl_changes(
    id: str,
    job_id: Optional[str] = Query(None, description="Optional specific CrawlJob ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a comprehensive change report categorizing pages into New, Changed, Removed, and Unchanged.
    """
    return await CrawlerService.get_crawl_changes(
        db=db,
        organization_id=current_user.organization_id,
        source_id=id,
        job_id=job_id
    )

