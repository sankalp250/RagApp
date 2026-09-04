"""
engine.py — WebsiteCrawler: Core Tiered Crawl Execution Engine
===============================================================
Orchestrates the complete website crawl pipeline:

  FRONTIER SEEDING:
    1. robots.txt → parse disallow rules, crawl-delay, sitemap declarations
    2. sitemap.xml / sitemap_index → recursive URL discovery

  CRAWL LOOP (bounded concurrency via asyncio.Semaphore):
    For each URL in the frontier:
      a. Validate: SSRF check, same-domain, not restricted, not already visited
      b. Tier 1: httpx HTTP fetch → BeautifulSoup content extraction
         If meaningful → proceed
         Else → Tier 2: Playwright headless render
      c. Content-hash deduplication vs stored CrawledPage record
         If unchanged → mark UNCHANGED, skip document update
         If new/changed → create/update Document, enqueue embedding job
      d. Extract discovered internal links → add to frontier
      e. Update CrawlJob progress counters (thread-safe)

  COMPLETION:
    Update CrawlJob status to COMPLETED / FAILED / PARTIAL
    Update KnowledgeSource last_crawled_at

Configuration (all from Settings or per-job KnowledgeSource.config):
  MAX_CONCURRENT_REQUESTS   default 5
  CRAWL_DELAY_SECONDS       default 1.0  (overridden by robots.txt Crawl-delay)
  REQUEST_TIMEOUT_SECONDS   default 20.0
  MAX_PAGES                 default 50  (from KnowledgeSource.config)
  MAX_DEPTH                 default 2   (from KnowledgeSource.config)
  MAX_CONTENT_SIZE_BYTES    default 10 MB
"""
import asyncio
import hashlib
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, Set

import httpx
from sqlalchemy import select, update

from backend.app.core.logging import logger
from backend.app.db.models.crawler import CrawlJob, CrawledPage, KnowledgeSource
from backend.app.db.models.document import Document
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.crawler.html_cleaner import HTMLCleaner
from backend.app.domains.crawler.playwright_renderer import PlaywrightRenderer
from backend.app.domains.crawler.robots import RobotsParser
from backend.app.domains.crawler.sitemap import SitemapDiscoverer
from backend.app.domains.crawler.url_tools import (
    is_valid_crawl_url,
    normalize_url,
)
from backend.app.workers.document_jobs import process_document_job
from backend.app.workers.queue import job_queue

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_MAX_CONCURRENT = 5
DEFAULT_CRAWL_DELAY = 1.0
DEFAULT_REQUEST_TIMEOUT = 20.0
DEFAULT_MAX_PAGES = 50
DEFAULT_MAX_DEPTH = 2
DEFAULT_MAX_CONTENT_BYTES = 10 * 1024 * 1024

HTTP_RETRY_CODES = {429, 500, 502, 503, 504}
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2.0  # seconds; will be multiplied by retry attempt

USER_AGENT = "RagCrawlerBot/1.0"


# ---------------------------------------------------------------------------
# Internal state
# ---------------------------------------------------------------------------

@dataclass
class _PageTask:
    url: str
    depth: int


@dataclass
class _CrawlStats:
    pages_discovered: int = 0
    pages_processed: int = 0
    pages_failed: int = 0
    pages_unchanged: int = 0
    pages_changed: int = 0
    pages_new: int = 0
    pages_removed: int = 0
    pages_skipped: int = 0
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def increment(self, field_name: str, by: int = 1) -> None:
        async with self._lock:
            current = getattr(self, field_name)
            setattr(self, field_name, current + by)


# ---------------------------------------------------------------------------
# Main engine
# ---------------------------------------------------------------------------

class WebsiteCrawler:
    """
    Runs a single complete crawl or incremental re-crawl for one KnowledgeSource.
    Instantiate once per crawl job; do not reuse across jobs.
    """

    def __init__(
        self,
        crawl_job_id: str,
        knowledge_source_id: str,
        organization_id: str,
        agent_id: str,
        root_url: str,
        config: dict,
        crawl_version: int = 1,
    ) -> None:
        self.crawl_job_id = crawl_job_id
        self.knowledge_source_id = knowledge_source_id
        self.organization_id = organization_id
        self.agent_id = agent_id
        self.root_url = root_url.rstrip("/")
        self.crawl_version = crawl_version

        # Per-source crawl config (from KnowledgeSource.config)
        self.max_pages: int = int(config.get("max_pages", DEFAULT_MAX_PAGES))
        self.max_depth: int = int(config.get("max_depth", DEFAULT_MAX_DEPTH))
        self.max_concurrent: int = int(config.get("max_concurrent_requests", DEFAULT_MAX_CONCURRENT))
        self.crawl_delay: float = float(config.get("crawl_delay_seconds", DEFAULT_CRAWL_DELAY))
        self.request_timeout: float = float(config.get("request_timeout_seconds", DEFAULT_REQUEST_TIMEOUT))
        self.allow_subdomains: bool = bool(config.get("include_subdomains", False))
        self.include_patterns: list = config.get("match_patterns", [])
        self.exclude_patterns: list = config.get("exclude_patterns", [])

        self.stats = _CrawlStats()
        self._visited_urls: Set[str] = set()
        self._discovered_urls_this_run: Set[str] = set()
        self._active_urls_before: Set[str] = set()
        self._frontier: asyncio.Queue = asyncio.Queue()
        self._semaphore = asyncio.Semaphore(self.max_concurrent)
        self._robots: Optional[RobotsParser] = None

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    async def crawl(self) -> _CrawlStats:
        """Execute the full crawl and return final statistics."""
        start = time.monotonic()
        logger.info(
            f"[crawl_job={self.crawl_job_id}] Starting crawl (version={self.crawl_version}): {self.root_url} "
            f"(max_pages={self.max_pages}, max_depth={self.max_depth}, "
            f"concurrency={self.max_concurrent})"
        )

        # Step 0: Snapshot active URLs before this run for removal detection
        try:
            async with AsyncSessionLocal() as db:
                res_active = await db.execute(
                    select(CrawledPage.url).where(
                        CrawledPage.knowledge_source_id == self.knowledge_source_id,
                        CrawledPage.is_active == True,
                    )
                )
                self._active_urls_before = set(res_active.scalars().all())
                logger.debug(f"Pre-crawl active pages snapshot: {len(self._active_urls_before)} URL(s)")
        except Exception as exc:
            logger.warning(f"Failed to snapshot pre-crawl active pages: {exc}")

        # Step 1: robots.txt
        self._robots = await RobotsParser.fetch(self.root_url)
        effective_delay = self._robots.crawl_delay or self.crawl_delay

        # Step 2: sitemap discovery → seed frontier
        known_sitemaps = self._robots.sitemaps or []
        sitemap_disc = SitemapDiscoverer(self.root_url, self.allow_subdomains)
        sitemap_urls = await sitemap_disc.discover(known_sitemaps)

        for url in sitemap_urls:
            self._enqueue_if_valid(url, depth=0)

        # Always include the root URL itself
        self._enqueue_if_valid(self.root_url, depth=0)

        # SSRF Redirect Interceptor: validates every 3xx redirect destination
        async def _check_redirect_ssrf(response: httpx.Response):
            if response.is_redirect:
                location = response.headers.get("Location")
                if location:
                    from backend.app.domains.crawler.url_tools import is_safe_url
                    full_redirect_url = str(response.url.join(location))
                    if not is_safe_url(full_redirect_url):
                        logger.warning(f"[SSRF Protection] Blocked dangerous redirect to: {full_redirect_url}")
                        raise httpx.RequestError(f"Blocked SSRF redirect destination: {full_redirect_url}", request=response.request)

        # Step 3: bounded concurrency crawl loop
        async with httpx.AsyncClient(
            timeout=self.request_timeout,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
            limits=httpx.Limits(max_connections=self.max_concurrent + 2),
            event_hooks={"response": [_check_redirect_ssrf]},
        ) as http_client:

            workers = [
                asyncio.create_task(self._worker(http_client, effective_delay))
                for _ in range(self.max_concurrent)
            ]

            await self._frontier.join()

            for w in workers:
                w.cancel()
            await asyncio.gather(*workers, return_exceptions=True)

        # Step 4: Detect and deprecate removed pages
        removed_urls = self._active_urls_before - self._discovered_urls_this_run
        if removed_urls:
            logger.info(f"[crawl_job={self.crawl_job_id}] Deprecating {len(removed_urls)} removed page(s)")
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            try:
                async with AsyncSessionLocal() as db:
                    for r_url in removed_urls:
                        res_p = await db.execute(
                            select(CrawledPage).where(
                                CrawledPage.knowledge_source_id == self.knowledge_source_id,
                                CrawledPage.url == r_url,
                            )
                        )
                        page = res_p.scalars().first()
                        if page:
                            page.is_active = False
                            page.status = "DEPRECATED"
                            page.change_status = "REMOVED"
                            page.last_changed_at = now

                        res_d = await db.execute(
                            select(Document).where(
                                Document.knowledge_source_id == self.knowledge_source_id,
                                Document.source_url == r_url,
                            )
                        )
                        doc = res_d.scalars().first()
                        if doc:
                            doc.is_active = False
                            doc.status = "DEPRECATED"

                    await db.commit()
                await self.stats.increment("pages_removed", len(removed_urls))
            except Exception as exc:
                logger.error(f"Failed to deprecate removed pages: {exc}", exc_info=True)

        elapsed = time.monotonic() - start
        logger.info(
            f"[crawl_job={self.crawl_job_id}] Crawl complete in {elapsed:.1f}s — "
            f"discovered={self.stats.pages_discovered}, "
            f"new={self.stats.pages_new}, "
            f"changed={self.stats.pages_changed}, "
            f"unchanged={self.stats.pages_unchanged}, "
            f"removed={self.stats.pages_removed}, "
            f"failed={self.stats.pages_failed}"
        )
        return self.stats

    # ------------------------------------------------------------------
    # Worker loop
    # ------------------------------------------------------------------

    async def _worker(self, http_client: httpx.AsyncClient, crawl_delay: float) -> None:
        """Single concurrent worker; pulls from frontier and processes pages."""
        while True:
            try:
                task: _PageTask = await self._frontier.get()
                try:
                    await self._process_page(http_client, task)
                    await asyncio.sleep(crawl_delay)
                finally:
                    self._frontier.task_done()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error(f"Worker error: {exc}", exc_info=True)

    # ------------------------------------------------------------------
    # Single page processing
    # ------------------------------------------------------------------

    async def _process_page(self, http_client: httpx.AsyncClient, task: _PageTask) -> None:
        url = task.url
        depth = task.depth

        # Hard limit guard
        if self.stats.pages_discovered >= self.max_pages:
            return
        if not self._robots.is_allowed(url):
            logger.debug(f"Blocked by robots.txt: {url}")
            await self.stats.increment("pages_skipped")
            return

        await self.stats.increment("pages_discovered")

        async with self._semaphore:
            html_bytes: Optional[bytes] = None
            http_status: Optional[int] = None
            extraction_method = "httpx"
            error_message: Optional[str] = None

            # ---------- Tier 1: httpx fetch ----------
            html_bytes, http_status, error_message = await self._fetch_with_retry(
                http_client, url
            )

            if html_bytes is None:
                await self._save_page_record(
                    url=url, depth=depth, status="FAILED",
                    http_status=http_status, error_message=error_message,
                    content_hash=None, title=None,
                )
                await self.stats.increment("pages_failed")
                return

            # Track discovered URL for removal detection
            self._discovered_urls_this_run.add(url)

            # ---------- Tier 1: Extract content ----------
            extraction = HTMLCleaner.extract(html_bytes, url)

            # ---------- Tier 2: Playwright fallback ----------
            if not extraction.is_meaningful:
                renderer = await PlaywrightRenderer.get_instance()
                if renderer:
                    logger.debug(f"Tier 2 fallback (Playwright) for: {url}")
                    rendered_html = await renderer.render(url)
                    if rendered_html:
                        extraction = HTMLCleaner.extract(rendered_html.encode("utf-8"), url)
                        extraction_method = "playwright"

            # Use canonical URL if available and still same domain
            canonical = extraction.canonical_url
            if canonical:
                norm_canonical = normalize_url(canonical)
                if norm_canonical and is_valid_crawl_url(norm_canonical, self.root_url, self.allow_subdomains):
                    url = norm_canonical
                    self._discovered_urls_this_run.add(url)

            # ---------- Incremental Deduplication & Change Detection ----------
            existing_page = await self._get_existing_page(url)

            if existing_page and existing_page.content_hash and existing_page.content_hash == extraction.content_hash:
                # Page content has NOT changed
                logger.debug(f"Unchanged (hash match): {url}")
                await self._save_page_record(
                    url=url, depth=depth, status="UNCHANGED", change_status="UNCHANGED",
                    http_status=http_status, error_message=None,
                    content_hash=extraction.content_hash, previous_hash=existing_page.previous_hash or existing_page.content_hash,
                    title=extraction.title, is_active=True,
                )
                await self.stats.increment("pages_unchanged")
            elif existing_page and existing_page.content_hash:
                # Page content HAS CHANGED
                logger.info(f"Page content CHANGED: {url} (old={existing_page.content_hash[:8]} -> new={extraction.content_hash[:8]})")
                old_hash = existing_page.content_hash
                doc_id = await self._save_document_and_page(
                    url=url, depth=depth,
                    extraction=extraction,
                    http_status=http_status,
                    extraction_method=extraction_method,
                    change_status="CHANGED",
                    previous_hash=old_hash,
                )
                if doc_id:
                    job_queue.enqueue(process_document_job, doc_id)
                await self.stats.increment("pages_changed")
                await self.stats.increment("pages_processed")
            else:
                # NEW Page
                logger.info(f"NEW Page discovered: {url}")
                doc_id = await self._save_document_and_page(
                    url=url, depth=depth,
                    extraction=extraction,
                    http_status=http_status,
                    extraction_method=extraction_method,
                    change_status="NEW",
                    previous_hash=None,
                )
                if doc_id:
                    job_queue.enqueue(process_document_job, doc_id)
                await self.stats.increment("pages_new")
                await self.stats.increment("pages_processed")

            # ---------- Link discovery for next depth ----------
            if depth < self.max_depth:
                for link in extraction.links:
                    norm = normalize_url(link, url)
                    if norm:
                        self._enqueue_if_valid(norm, depth=depth + 1)

    # ------------------------------------------------------------------
    # HTTP fetch with retry
    # ------------------------------------------------------------------

    async def _fetch_with_retry(
        self, client: httpx.AsyncClient, url: str
    ) -> tuple[Optional[bytes], Optional[int], Optional[str]]:
        """Fetch URL with exponential backoff for transient HTTP errors."""
        last_error: Optional[str] = None
        last_status: Optional[int] = None

        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.get(url)
                last_status = resp.status_code

                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    if "text/html" not in content_type and "text/plain" not in content_type:
                        return None, resp.status_code, f"Non-HTML content-type: {content_type}"
                    return resp.content, resp.status_code, None

                elif resp.status_code in HTTP_RETRY_CODES:
                    wait = RETRY_BACKOFF_BASE ** attempt
                    logger.debug(f"HTTP {resp.status_code} for {url}, retrying in {wait}s (attempt {attempt + 1})")
                    await asyncio.sleep(wait)
                    last_error = f"HTTP {resp.status_code}"

                elif resp.status_code == 404:
                    return None, 404, "HTTP 404 Not Found"

                elif resp.status_code == 403:
                    return None, 403, "HTTP 403 Forbidden"

                else:
                    return None, resp.status_code, f"HTTP {resp.status_code}"

            except httpx.TimeoutException:
                last_error = "Request timeout"
                logger.debug(f"Timeout on attempt {attempt + 1} for {url}")
                await asyncio.sleep(RETRY_BACKOFF_BASE ** attempt)

            except httpx.TooManyRedirects:
                return None, None, "Redirect loop detected"

            except httpx.RequestError as exc:
                last_error = f"{type(exc).__name__}: {exc}"
                await asyncio.sleep(RETRY_BACKOFF_BASE ** attempt)

        return None, last_status, last_error or "Max retries exceeded"

    # ------------------------------------------------------------------
    # DB operations
    # ------------------------------------------------------------------

    async def _get_existing_page(self, url: str) -> Optional[CrawledPage]:
        """Return the CrawledPage record for this URL, or None if not found."""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(CrawledPage).where(
                        CrawledPage.knowledge_source_id == self.knowledge_source_id,
                        CrawledPage.url == url,
                    )
                )
                return result.scalars().first()
        except Exception as exc:
            logger.warning(f"_get_existing_page failed for {url}: {exc}")
            return None

    async def _get_existing_hash(self, url: str) -> Optional[str]:
        """Return the stored content_hash for this URL, or None if not found."""
        page = await self._get_existing_page(url)
        return page.content_hash if page else None

    async def _save_page_record(
        self,
        url: str,
        depth: int,
        status: str,
        change_status: str = "UNCHANGED",
        http_status: Optional[int] = None,
        error_message: Optional[str] = None,
        content_hash: Optional[str] = None,
        previous_hash: Optional[str] = None,
        title: Optional[str] = None,
        is_active: bool = True,
    ) -> None:
        """Insert or update a CrawledPage record."""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(CrawledPage).where(
                        CrawledPage.knowledge_source_id == self.knowledge_source_id,
                        CrawledPage.url == url,
                    )
                )
                page = result.scalars().first()
                now = datetime.now(timezone.utc).replace(tzinfo=None)

                if page:
                    page.status = status
                    page.change_status = change_status
                    page.http_status = http_status
                    page.error_message = error_message
                    page.content_hash = content_hash or page.content_hash
                    page.previous_hash = previous_hash or page.previous_hash
                    page.title = title or page.title
                    page.crawl_version = self.crawl_version
                    page.is_active = is_active
                    page.last_crawled_at = now
                    if status in ("INDEXED", "UNCHANGED") or change_status in ("NEW", "CHANGED"):
                        page.last_changed_at = now
                else:
                    page = CrawledPage(
                        organization_id=self.organization_id,
                        agent_id=self.agent_id,
                        knowledge_source_id=self.knowledge_source_id,
                        url=url,
                        title=title,
                        depth=depth,
                        status=status,
                        change_status=change_status,
                        http_status=http_status,
                        content_hash=content_hash,
                        previous_hash=previous_hash,
                        crawl_version=self.crawl_version,
                        is_active=is_active,
                        error_message=error_message,
                        last_crawled_at=now,
                        last_changed_at=now,
                    )
                    db.add(page)

                await db.commit()
        except Exception as exc:
            logger.error(f"save_page_record failed for {url}: {exc}", exc_info=True)

    async def _save_document_and_page(
        self,
        url: str,
        depth: int,
        extraction,
        http_status: Optional[int],
        extraction_method: str,
        change_status: str = "NEW",
        previous_hash: Optional[str] = None,
    ) -> Optional[str]:
        """
        Upsert CrawledPage (status=INDEXED) and create/update the Document.
        Returns the document_id to queue for embedding.
        """
        try:
            async with AsyncSessionLocal() as db:
                now = datetime.now(timezone.utc).replace(tzinfo=None)

                # ---- CrawledPage ----
                result = await db.execute(
                    select(CrawledPage).where(
                        CrawledPage.knowledge_source_id == self.knowledge_source_id,
                        CrawledPage.url == url,
                    )
                )
                page = result.scalars().first()

                if page:
                    page.status = "INDEXED"
                    page.change_status = change_status
                    page.previous_hash = previous_hash or page.content_hash
                    page.content_hash = extraction.content_hash
                    page.title = extraction.title
                    page.http_status = http_status
                    page.canonical_url = extraction.canonical_url
                    page.crawl_version = self.crawl_version
                    page.is_active = True
                    page.last_crawled_at = now
                    page.last_changed_at = now
                    page.page_metadata = {"extraction_method": extraction_method}
                else:
                    page = CrawledPage(
                        organization_id=self.organization_id,
                        agent_id=self.agent_id,
                        knowledge_source_id=self.knowledge_source_id,
                        url=url,
                        canonical_url=extraction.canonical_url,
                        title=extraction.title,
                        depth=depth,
                        status="INDEXED",
                        change_status=change_status,
                        http_status=http_status,
                        content_hash=extraction.content_hash,
                        previous_hash=previous_hash,
                        crawl_version=self.crawl_version,
                        is_active=True,
                        last_crawled_at=now,
                        last_changed_at=now,
                        page_metadata={"extraction_method": extraction_method},
                    )
                    db.add(page)

                await db.flush()
                page_id = page.id

                # ---- Document ----
                doc_result = await db.execute(
                    select(Document).where(
                        Document.knowledge_source_id == self.knowledge_source_id,
                        Document.source_url == url,
                    )
                )
                doc = doc_result.scalars().first()

                content_text = extraction.content_markdown

                if doc:
                    doc.title = extraction.title or doc.title
                    doc.content = content_text
                    doc.previous_hash = previous_hash or doc.content_hash
                    doc.content_hash = extraction.content_hash
                    doc.version = (doc.version or 1) + 1 if change_status == "CHANGED" else (doc.version or 1)
                    doc.is_active = True
                    doc.status = "UPLOADED"
                    doc.source_page_id = page_id
                    doc.doc_metadata = {
                        "source_type": "website",
                        "source_url": url,
                        "canonical_url": extraction.canonical_url,
                        "title": extraction.title,
                        "description": extraction.description,
                        "organization_id": self.organization_id,
                        "agent_id": self.agent_id,
                        "crawl_id": self.crawl_job_id,
                        "crawl_version": self.crawl_version,
                        "extraction_method": extraction_method,
                        "word_count": extraction.word_count,
                        "change_status": change_status,
                    }
                    doc_id = doc.id
                else:
                    doc = Document(
                        organization_id=self.organization_id,
                        agent_id=self.agent_id,
                        knowledge_source_id=self.knowledge_source_id,
                        source_page_id=page_id,
                        source_url=url,
                        canonical_url=extraction.canonical_url,
                        title=extraction.title,
                        filename=f"web:{url}",
                        storage_path=f"web/{self.organization_id}/{self.agent_id}/{extraction.content_hash[:16]}.md",
                        content=content_text,
                        content_hash=extraction.content_hash,
                        previous_hash=previous_hash,
                        version=self.crawl_version,
                        is_active=True,
                        status="UPLOADED",
                        mime_type="text/markdown",
                        file_size_bytes=len(content_text.encode("utf-8")),
                        doc_metadata={
                            "source_type": "website",
                            "source_url": url,
                            "canonical_url": extraction.canonical_url,
                            "title": extraction.title,
                            "description": extraction.description,
                            "organization_id": self.organization_id,
                            "agent_id": self.agent_id,
                            "crawl_id": self.crawl_job_id,
                            "crawl_version": self.crawl_version,
                            "extraction_method": extraction_method,
                            "word_count": extraction.word_count,
                            "change_status": change_status,
                        },
                    )
                    db.add(doc)
                    await db.flush()
                    doc_id = doc.id

                await db.commit()
                return doc_id

        except Exception as exc:
            logger.error(f"save_document_and_page failed for {url}: {exc}", exc_info=True)
            await self._save_page_record(
                url=url, depth=depth, status="FAILED", change_status="UNCHANGED",
                http_status=http_status, error_message=str(exc),
                content_hash=None, title=None,
            )
            return None

    # ------------------------------------------------------------------
    # Frontier management
    # ------------------------------------------------------------------

    def _enqueue_if_valid(self, url: str, depth: int) -> None:
        """Add a URL to the frontier if it passes all validation checks and hasn't been visited."""
        if depth > self.max_depth:
            return
        if self.stats.pages_discovered >= self.max_pages:
            return

        norm = normalize_url(url)
        if not norm:
            return
        if norm in self._visited_urls:
            return
        if not is_valid_crawl_url(norm, self.root_url, self.allow_subdomains):
            return

        # Exclude URL-level patterns
        for pattern in self.exclude_patterns:
            if pattern.lower() in norm.lower():
                return

        # Include pattern filtering (if any configured)
        if self.include_patterns:
            if not any(p.lower() in norm.lower() for p in self.include_patterns):
                return

        self._visited_urls.add(norm)
        self._frontier.put_nowait(_PageTask(url=norm, depth=depth))
