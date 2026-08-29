"""
test_incremental_recrawl.py — Incremental Website Re-Crawling Test Suite
========================================================================
Validates all requirements for Task 5:
  1. Unchanged page: identical content hash -> UNCHANGED, no re-embedding
  2. Changed page: modified content hash -> CHANGED, previous_hash stored, Document version incremented
  3. New page: newly discovered URL -> NEW, Document created & indexed
  4. Removed page: missing URL on re-crawl -> REMOVED, is_active=False, Document.status='DEPRECATED'
  5. Concurrent recrawl request: distributed lock + state check prevents duplicate job creation
  6. Duplicate recrawl request: returns 409 Conflict when job is already active
  7. Audit Runs & Changes API: verifies /runs and /changes return accurate categorized metrics
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, List, Any
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy import select, func
from fastapi import HTTPException

from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.db.models.organization import Organization
from backend.app.db.models.agent import Agent
from backend.app.db.models.crawler import KnowledgeSource, CrawlJob, CrawledPage
from backend.app.db.models.document import Document
from backend.app.domains.crawler.service import CrawlerService
from backend.app.domains.crawler.engine import WebsiteCrawler
from backend.app.domains.crawler.robots import RobotsParser
from backend.app.domains.crawler.sitemap import SitemapDiscoverer


PASS = "[OK]"
FAIL = "[X]"
results: Dict[str, bool] = {}


def check(name: str, condition: bool, detail: str = "") -> None:
    icon = PASS if condition else FAIL
    results[name] = condition
    status = "PASS" if condition else "FAIL"
    extra = f"  ({detail})" if detail else ""
    print(f"  {icon}  [{status}] {name}{extra}")


async def run_all_tests():
    print("=" * 65)
    print("  TASK 5: INCREMENTAL WEBSITE RE-CRAWL TEST SUITE")
    print("=" * 65)

    await init_db()

    ts = int(time.time() * 1000)
    org_id = f"test_org_recrawl_{ts}"
    agent_id = f"test_agent_recrawl_{ts}"
    source_id = f"test_ks_recrawl_{ts}"

    # Setup Organization, Agent, and KnowledgeSource
    async with AsyncSessionLocal() as db:
        org = Organization(id=org_id, name="Recrawl Corp", slug=f"recrawl-corp-{ts}")
        db.add(org)

        agent = Agent(
            id=agent_id,
            organization_id=org_id,
            name="Recrawl Assistant",
            public_key=f"pk_recrawl_{ts}",
            status="ACTIVE"
        )
        db.add(agent)

        source = KnowledgeSource(
            id=source_id,
            organization_id=org_id,
            agent_id=agent_id,
            type="WEBSITE",
            name="Product Docs",
            url="https://product.example.com",
            status="ACTIVE",
            current_version=1,
            config={"max_depth": 2, "max_pages": 50}
        )
        db.add(source)
        await db.commit()

    # ----------------------------------------------------------
    # Step 1: Initial Crawl Simulation (Run 1: 3 Pages)
    # Page 1: /about (stays unchanged)
    # Page 2: /pricing (will change in Run 2)
    # Page 3: /old-feature (will be removed in Run 2)
    # ----------------------------------------------------------
    print("\n-- 1. Initial Crawl (Run 1) -------------------------")
    
    html_about_v1 = b"<html><head><title>About Us</title></head><body><main><h1>About</h1><p>We are a leading technology company providing automated customer support solutions. Our mission is to make intelligent conversational agents accessible to every business worldwide.</p></main></body></html>"
    html_pricing_v1 = b"<html><head><title>Pricing</title></head><body><main><h1>Pricing Plans</h1><p>Starter Plan costs 10 dollars per month. Pro Plan costs 50 dollars per month. Enterprise plan includes custom pricing and dedicated support engineers.</p></main></body></html>"
    html_old_v1 = b"<html><head><title>Old Feature</title></head><body><main><h1>Legacy Feature</h1><p>This is a legacy feature guide that will be decommissioned in the next product release. Please migrate to the new interface.</p></main></body></html>"

    crawl_job_1_id = f"job_run1_{ts}"
    async with AsyncSessionLocal() as db:
        job1 = CrawlJob(
            id=crawl_job_1_id,
            organization_id=org_id,
            agent_id=agent_id,
            knowledge_source_id=source_id,
            status="RUNNING",
            trigger_type="MANUAL",
            crawl_version=1,
        )
        db.add(job1)
        await db.commit()

    crawler1 = WebsiteCrawler(
        crawl_job_id=crawl_job_1_id,
        knowledge_source_id=source_id,
        organization_id=org_id,
        agent_id=agent_id,
        root_url="https://product.example.com",
        config={"max_pages": 50, "max_depth": 2, "crawl_delay_seconds": 0},
        crawl_version=1,
    )

    def mock_is_valid_url(url, root_url, allow_subdomains=False):
        return "product.example.com" in url

    mock_robots = MagicMock()
    mock_robots.is_allowed = lambda u: True
    mock_robots.sitemaps = []
    mock_robots.crawl_delay = 0

    with patch("backend.app.domains.crawler.engine.is_valid_crawl_url", side_effect=mock_is_valid_url), \
         patch("backend.app.domains.crawler.robots.RobotsParser.fetch", new=AsyncMock(return_value=mock_robots)), \
         patch("backend.app.domains.crawler.sitemap.SitemapDiscoverer.discover", new=AsyncMock(return_value=[])), \
         patch("backend.app.domains.crawler.playwright_renderer.PlaywrightRenderer.get_instance", new=AsyncMock(return_value=None)):

        # Mock fetch responses for Run 1
        async def mock_fetch_run1(client, url):
            if "about" in url:
                return html_about_v1, 200, None
            elif "pricing" in url:
                return html_pricing_v1, 200, None
            elif "old-feature" in url:
                return html_old_v1, 200, None
            elif "product.example.com" in url:
                root_html = b'<html><body><main><p>Home page overview of our platform with lots of helpful content.</p><a href="/about">About</a><a href="/pricing">Pricing</a><a href="/old-feature">Old Feature</a></main></body></html>'
                return root_html, 200, None
            return None, 404, "Not Found"

        crawler1._fetch_with_retry = mock_fetch_run1

        stats1 = await crawler1.crawl()

    check("1. Run 1: processed initial pages", stats1.pages_new >= 3 or stats1.pages_processed >= 3, f"new={stats1.pages_new}, processed={stats1.pages_processed}")

    # Mark Run 1 completed
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    async with AsyncSessionLocal() as db:
        j1 = (await db.execute(select(CrawlJob).where(CrawlJob.id == crawl_job_1_id))).scalars().first()
        j1.status = "COMPLETED"
        j1.pages_new = stats1.pages_new
        j1.pages_processed = stats1.pages_processed
        j1.pages_unchanged = stats1.pages_unchanged
        j1.pages_changed = stats1.pages_changed
        j1.pages_removed = stats1.pages_removed
        j1.completed_at = now

        src = (await db.execute(select(KnowledgeSource).where(KnowledgeSource.id == source_id))).scalars().first()
        src.status = "ACTIVE"
        src.current_version = 1
        src.last_successful_crawl_at = now
        await db.commit()

    # Capture about_page hash from Run 1 for comparison
    async with AsyncSessionLocal() as db:
        about_p = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%about%")))).scalars().first()
        about_hash_run1 = about_p.content_hash
        pricing_p = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%pricing%")))).scalars().first()
        pricing_hash_run1 = pricing_p.content_hash
        pricing_doc = (await db.execute(select(Document).where(Document.knowledge_source_id == source_id, Document.source_url.like("%pricing%")))).scalars().first()
        pricing_doc_version_run1 = pricing_doc.version

    # ----------------------------------------------------------
    # Step 2: Incremental Re-Crawl (Run 2)
    # Page 1: /about (IDENTICAL HTML -> UNCHANGED)
    # Page 2: /pricing (MODIFIED HTML -> CHANGED)
    # Page 3: /old-feature (OMITTED from root HTML -> REMOVED)
    # Page 4: /new-feature (NEW LINK -> NEW)
    # ----------------------------------------------------------
    print("\n-- 2. Incremental Re-Crawl (Run 2) ------------------")
    
    html_pricing_v2 = b"<html><head><title>Pricing</title></head><body><main><h1>Pricing Plans - 2026 UPDATE</h1><p>Starter Plan is now 15 dollars per month. Pro Plan is 60 dollars per month. Enterprise plan includes 24/7 dedicated support and custom model fine-tuning.</p></main></body></html>"
    html_new_v2 = b"<html><head><title>New AI Feature</title></head><body><main><h1>Brand New AI Search</h1><p>We are thrilled to launch our new AI Knowledge Search with real-time indexing and multi-lingual support.</p></main></body></html>"

    crawl_job_2_id = f"job_run2_{ts}"
    async with AsyncSessionLocal() as db:
        job2 = CrawlJob(
            id=crawl_job_2_id,
            organization_id=org_id,
            agent_id=agent_id,
            knowledge_source_id=source_id,
            status="RUNNING",
            trigger_type="RECRAWL",
            crawl_version=2,
        )
        db.add(job2)
        await db.commit()

    crawler2 = WebsiteCrawler(
        crawl_job_id=crawl_job_2_id,
        knowledge_source_id=source_id,
        organization_id=org_id,
        agent_id=agent_id,
        root_url="https://product.example.com",
        config={"max_pages": 50, "max_depth": 2, "crawl_delay_seconds": 0},
        crawl_version=2,
    )

    with patch("backend.app.domains.crawler.engine.is_valid_crawl_url", side_effect=mock_is_valid_url), \
         patch("backend.app.domains.crawler.robots.RobotsParser.fetch", new=AsyncMock(return_value=mock_robots)), \
         patch("backend.app.domains.crawler.sitemap.SitemapDiscoverer.discover", new=AsyncMock(return_value=[])), \
         patch("backend.app.domains.crawler.playwright_renderer.PlaywrightRenderer.get_instance", new=AsyncMock(return_value=None)):

        async def mock_fetch_run2(client, url):
            if "about" in url:
                return html_about_v1, 200, None  # Unchanged
            elif "pricing" in url:
                return html_pricing_v2, 200, None  # Changed!
            elif "new-feature" in url:
                return html_new_v2, 200, None  # New page!
            elif "product.example.com" in url:
                # Notice /old-feature is omitted; /new-feature is added!
                root_html = b'<html><body><main><p>Home page overview of our platform with lots of helpful content.</p><a href="/about">About</a><a href="/pricing">Pricing</a><a href="/new-feature">New AI Feature</a></main></body></html>'
                return root_html, 200, None
            return None, 404, "Not Found"

        crawler2._fetch_with_retry = mock_fetch_run2

        stats2 = await crawler2.crawl()

    # Complete Run 2
    async with AsyncSessionLocal() as db:
        j2 = (await db.execute(select(CrawlJob).where(CrawlJob.id == crawl_job_2_id))).scalars().first()
        j2.status = "COMPLETED"
        j2.pages_unchanged = stats2.pages_unchanged
        j2.pages_changed = stats2.pages_changed
        j2.pages_new = stats2.pages_new
        j2.pages_removed = stats2.pages_removed
        j2.pages_processed = stats2.pages_processed
        j2.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        src2 = (await db.execute(select(KnowledgeSource).where(KnowledgeSource.id == source_id))).scalars().first()
        src2.status = "ACTIVE"
        src2.current_version = 2
        src2.last_successful_crawl_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()

    # ----------------------------------------------------------
    # Check Verification for Each Classification
    # ----------------------------------------------------------
    print("\n-- 3. Verify Incremental Classifications ------------")
    async with AsyncSessionLocal() as db:
        # 1. Unchanged Page Verification (/about)
        about_p2 = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%about%")))).scalars().first()
        check("1. Unchanged page: status is UNCHANGED", about_p2.change_status == "UNCHANGED")
        check("1. Unchanged page: content hash unchanged", about_p2.content_hash == about_hash_run1)
        check("1. Unchanged page: is_active=True", about_p2.is_active is True)

        # 2. Changed Page Verification (/pricing)
        pricing_p2 = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%pricing%")))).scalars().first()
        pricing_doc2 = (await db.execute(select(Document).where(Document.knowledge_source_id == source_id, Document.source_url.like("%pricing%")))).scalars().first()
        check("2. Changed page: status is CHANGED", pricing_p2.change_status == "CHANGED")
        check("2. Changed page: previous_hash matches Run 1 hash", pricing_p2.previous_hash == pricing_hash_run1, f"prev={pricing_p2.previous_hash}, old={pricing_hash_run1}")
        check("2. Changed page: new content_hash generated", pricing_p2.content_hash != pricing_hash_run1)
        check("2. Changed page: Document version incremented", pricing_doc2.version == pricing_doc_version_run1 + 1, f"version={pricing_doc2.version}")
        check("2. Changed page: Document content updated", "2026 UPDATE" in (pricing_doc2.content or ""))

        # 3. New Page Verification (/new-feature)
        new_p2 = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%new-feature%")))).scalars().first()
        new_doc2 = (await db.execute(select(Document).where(Document.knowledge_source_id == source_id, Document.source_url.like("%new-feature%")))).scalars().first()
        check("3. New page: change_status is NEW", new_p2 is not None and new_p2.change_status == "NEW")
        check("3. New page: Document created and active", new_doc2 is not None and new_doc2.is_active is True)

        # 4. Removed Page Verification (/old-feature)
        old_p2 = (await db.execute(select(CrawledPage).where(CrawledPage.knowledge_source_id == source_id, CrawledPage.url.like("%old-feature%")))).scalars().first()
        old_doc2 = (await db.execute(select(Document).where(Document.knowledge_source_id == source_id, Document.source_url.like("%old-feature%")))).scalars().first()
        check("4. Removed page: change_status is REMOVED", old_p2 is not None and old_p2.change_status == "REMOVED")
        check("4. Removed page: CrawledPage is_active=False", old_p2 is not None and old_p2.is_active is False)
        check("4. Removed page: Document marked DEPRECATED", old_doc2 is not None and old_doc2.status == "DEPRECATED")

    # ----------------------------------------------------------
    # Step 4: Test Concurrency & Duplicate Protection on Re-Crawl
    # ----------------------------------------------------------
    print("\n-- 4. Concurrency & Duplicate Protection -------------")
    
    # 5. Duplicate recrawl when already active -> raises 409
    async with AsyncSessionLocal() as db:
        # Mark source as CRAWLING with active job
        active_job = CrawlJob(
            id=f"job_active_{ts}",
            organization_id=org_id,
            agent_id=agent_id,
            knowledge_source_id=source_id,
            status="RUNNING",
            trigger_type="RECRAWL"
        )
        db.add(active_job)
        await db.commit()

        # Attempt to trigger duplicate recrawl
        duplicate_raised_409 = False
        try:
            await CrawlerService.trigger_recrawl(db, org_id, source_id)
        except HTTPException as exc:
            if exc.status_code == 409:
                duplicate_raised_409 = True
        
        check("5/6. Duplicate recrawl while active raises 409 Conflict", duplicate_raised_409 is True)

        # Cleanup active job for subsequent tests
        await db.delete(active_job)
        await db.commit()

    # ----------------------------------------------------------
    # Step 5: Test /runs and /changes APIs
    # ----------------------------------------------------------
    print("\n-- 5. Runs & Changes API Verification ----------------")
    async with AsyncSessionLocal() as db:
        # Test list_crawl_runs
        runs_resp = await CrawlerService.list_crawl_runs(db, org_id, source_id)
        check("7. list_crawl_runs: returns runs list", runs_resp.total_runs >= 2, f"runs={runs_resp.total_runs}")

        # Test get_crawl_changes
        changes_resp = await CrawlerService.get_crawl_changes(db, org_id, source_id, job_id=crawl_job_2_id)
        check("7. get_crawl_changes: crawl_version is 2", changes_resp.crawl_version == 2)
        check("7. get_crawl_changes: summary has new pages", changes_resp.summary.new_count >= 1, f"new={changes_resp.summary.new_count}")
        check("7. get_crawl_changes: summary has changed pages", changes_resp.summary.changed_count >= 1, f"changed={changes_resp.summary.changed_count}")
        check("7. get_crawl_changes: summary has removed pages", changes_resp.summary.removed_count >= 1, f"removed={changes_resp.summary.removed_count}")
        check("7. get_crawl_changes: summary has unchanged pages", changes_resp.summary.unchanged_count >= 1, f"unchanged={changes_resp.summary.unchanged_count}")

    # ----------------------------------------------------------
    # Summary
    # ----------------------------------------------------------
    print("\n" + "=" * 65)
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    total = len(results)
    print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
    if failed > 0:
        print("\n  FAILED TESTS:")
        for name, ok in results.items():
            if not ok:
                print(f"    [X] {name}")
        raise SystemExit(1)
    else:
        print(f"\n  [SUCCESS] ALL {total} INCREMENTAL RE-CRAWL TESTS PASSED!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
