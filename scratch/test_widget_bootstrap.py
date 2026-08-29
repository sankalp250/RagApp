"""
test_widget_bootstrap.py — Widget Bootstrap & Automatic Initial Crawl Test Suite
================================================================================
Validates all 10 requirements for Task 4:
  1. First widget load: initiates initial crawl (CrawlJob QUEUED, crawl_triggered=True)
  2. Second widget load: returns existing status without triggering new crawl
  3. 100 concurrent widget loads: distributed lock ensures EXACTLY ONE crawl job is created
  4. Valid origin: allowed domain https://example.com is accepted
  5. Invalid origin: unauthorized domain https://hacker.com is rejected (widget_ready=False)
  6. Same agent on different domain: domain mismatch rejected without crawl creation
  7. Already crawled website: COMPLETED job returns knowledge_status="ready", crawl_triggered=False
  8. Crawl in progress: RUNNING job returns knowledge_status="processing", crawl_triggered=False
  9. Failed crawl: FAILED job returns knowledge_status="failed" during cooldown
  10. Retry: force_retry=True successfully triggers new retry crawl job
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from sqlalchemy import select, func, delete
from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.db.models.organization import Organization
from backend.app.db.models.agent import Agent
from backend.app.db.models.crawler import KnowledgeSource, CrawlJob
from backend.app.schemas.crawler import WidgetBootstrapRequest
from backend.app.domains.crawler.service import CrawlerService


PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
results: Dict[str, bool] = {}


def check(name: str, condition: bool, detail: str = "") -> None:
    icon = PASS if condition else FAIL
    results[name] = condition
    status = "PASS" if condition else "FAIL"
    extra = f"  ({detail})" if detail else ""
    print(f"  {icon}  [{status}] {name}{extra}")


async def run_all_tests():
    print("=" * 65)
    print("  TASK 4: WIDGET BOOTSTRAP & AUTOMATIC CRAWL TEST SUITE")
    print("=" * 65)

    await init_db()

    ts = int(time.time() * 1000)
    org_id = f"test_org_wb_{ts}"
    agent_id = f"test_agent_wb_{ts}"
    public_key = f"pk_wb_{ts}"

    # Setup Test Organization & Agent
    async with AsyncSessionLocal() as db:
        org = Organization(id=org_id, name="Widget Bootstrap Corp", slug=f"wb-corp-{ts}")
        db.add(org)

        agent = Agent(
            id=agent_id,
            organization_id=org_id,
            name="Aria Assistant",
            public_key=public_key,
            status="ACTIVE",
            configuration={
                "bot_title": "Aria AI Assistant",
                "greeting_message": "Hello from Widget!",
                "primary_color": "#6366f1",
                "allowed_domains": ["mycompany.com", "*.mycompany.com"]
            }
        )
        db.add(agent)

        # Knowledge Source for example.com
        source = KnowledgeSource(
            id=f"ks_wb_{ts}",
            organization_id=org_id,
            agent_id=agent_id,
            type="WEBSITE",
            name="Documentation",
            url="https://docs.example.com",
            status="ACTIVE",
            config={"max_depth": 2, "max_pages": 50, "include_subdomains": False}
        )
        db.add(source)
        await db.commit()

    # ──────────────────────────────────────────────────────────
    # Test 1: First Widget Load (Initial Crawl Triggered)
    # ──────────────────────────────────────────────────────────
    print("\n── 1. First Widget Load ──────────────────────────────")
    async with AsyncSessionLocal() as db:
        req1 = WidgetBootstrapRequest(
            public_key=public_key,
            origin="https://docs.example.com"
        )
        res1 = await CrawlerService.bootstrap_widget(db, req1)
        check("1. First widget load: widget_ready=True", res1.widget_ready is True)
        check("1. First widget load: crawl_triggered=True", res1.crawl_triggered is True)
        check("1. First widget load: knowledge_status='processing'", res1.knowledge_status == "processing")
        check("1. First widget load: crawl_job_id created", res1.crawl_job_id is not None, f"job_id={res1.crawl_job_id}")

    # ──────────────────────────────────────────────────────────
    # Test 2: Second Widget Load (Idempotent, No Duplicate Crawl)
    # ──────────────────────────────────────────────────────────
    print("\n── 2. Second Widget Load ─────────────────────────────")
    async with AsyncSessionLocal() as db:
        req2 = WidgetBootstrapRequest(
            public_key=public_key,
            origin="https://docs.example.com"
        )
        res2 = await CrawlerService.bootstrap_widget(db, req2)
        check("2. Second widget load: widget_ready=True", res2.widget_ready is True)
        check("2. Second widget load: crawl_triggered=False (No duplicate)", res2.crawl_triggered is False)
        check("2. Second widget load: knowledge_status='processing'", res2.knowledge_status == "processing")
        check("2. Second widget load: returns same active job", res2.crawl_job_id == res1.crawl_job_id)

    # ──────────────────────────────────────────────────────────
    # Test 3: 100 Concurrent Widget Loads (Distributed Lock Race Test)
    # ──────────────────────────────────────────────────────────
    print("\n── 3. 100 Concurrent Widget Loads ────────────────────")
    # Create fresh agent & source for isolated race test
    agent_id_race = f"agent_race_{ts}"
    pk_race = f"pk_race_{ts}"
    source_id_race = f"ks_race_{ts}"

    async with AsyncSessionLocal() as db:
        agent_race = Agent(
            id=agent_id_race,
            organization_id=org_id,
            name="Race Agent",
            public_key=pk_race,
            status="ACTIVE"
        )
        db.add(agent_race)
        source_race = KnowledgeSource(
            id=source_id_race,
            organization_id=org_id,
            agent_id=agent_id_race,
            type="WEBSITE",
            name="Race Docs",
            url="https://race-test.com",
            status="ACTIVE",
            config={"max_depth": 2, "max_pages": 50}
        )
        db.add(source_race)
        await db.commit()

    async def single_bootstrap():
        async with AsyncSessionLocal() as db_session:
            req = WidgetBootstrapRequest(
                public_key=pk_race,
                origin="https://race-test.com"
            )
            return await CrawlerService.bootstrap_widget(db_session, req)

    # Launch 100 concurrent requests simultaneously
    tasks = [single_bootstrap() for _ in range(100)]
    concurrent_results = await asyncio.gather(*tasks)

    # Check how many created a crawl job vs returned processing
    triggered_count = sum(1 for r in concurrent_results if r.crawl_triggered)
    ready_count = sum(1 for r in concurrent_results if r.widget_ready)

    # Verify directly in Database how many CrawlJob records exist for this source
    async with AsyncSessionLocal() as db:
        count_res = await db.execute(
            select(func.count(CrawlJob.id)).where(CrawlJob.knowledge_source_id == source_id_race)
        )
        db_job_count = count_res.scalar() or 0

    check("3. 100 concurrent loads: all 100 return widget_ready=True", ready_count == 100, f"ready={ready_count}/100")
    check("3. 100 concurrent loads: exactly 1 request triggered crawl", triggered_count == 1, f"triggered={triggered_count}")
    check("3. 100 concurrent loads: database contains EXACTLY 1 CrawlJob", db_job_count == 1, f"db_jobs={db_job_count}")

    # ──────────────────────────────────────────────────────────
    # Test 4: Valid Origin (Allowed Domains in Agent Configuration)
    # ──────────────────────────────────────────────────────────
    print("\n── 4. Valid Origin via allowed_domains ────────────────")
    async with AsyncSessionLocal() as db:
        req4 = WidgetBootstrapRequest(
            public_key=public_key,
            origin="https://mycompany.com"
        )
        res4 = await CrawlerService.bootstrap_widget(db, req4)
        check("4. Valid origin (mycompany.com): widget_ready=True", res4.widget_ready is True)
        check("4. Valid origin: allowed and processed", res4.knowledge_status in ("processing", "ready"))

    # ──────────────────────────────────────────────────────────
    # Test 5: Invalid Origin (Unauthorized Hacker Origin)
    # ──────────────────────────────────────────────────────────
    print("\n── 5. Invalid Origin ──────────────────────────────────")
    async with AsyncSessionLocal() as db:
        req5 = WidgetBootstrapRequest(
            public_key=public_key,
            origin="https://hacker-website.com"
        )
        res5 = await CrawlerService.bootstrap_widget(db, req5)
        check("5. Invalid origin: widget_ready=False", res5.widget_ready is False)
        check("5. Invalid origin: knowledge_status='unauthorized'", res5.knowledge_status == "unauthorized")
        check("5. Invalid origin: crawl_triggered=False", res5.crawl_triggered is False)
        check("5. Invalid origin: error message populated", res5.error is not None)

    # ──────────────────────────────────────────────────────────
    # Test 6: Same Agent on Different Unauthorized Domain
    # ──────────────────────────────────────────────────────────
    print("\n── 6. Domain Mismatch ─────────────────────────────────")
    async with AsyncSessionLocal() as db:
        req6 = WidgetBootstrapRequest(
            agent_id=agent_id,
            origin="https://unrelated-domain.org"
        )
        res6 = await CrawlerService.bootstrap_widget(db, req6)
        check("6. Domain mismatch: widget_ready=False", res6.widget_ready is False)
        check("6. Domain mismatch: knowledge_status='unauthorized'", res6.knowledge_status == "unauthorized")

    # ──────────────────────────────────────────────────────────
    # Test 7: Already Crawled Website (Status COMPLETED)
    # ──────────────────────────────────────────────────────────
    print("\n── 7. Already Crawled Website ─────────────────────────")
    agent_id_comp = f"agent_comp_{ts}"
    pk_comp = f"pk_comp_{ts}"
    source_id_comp = f"ks_comp_{ts}"
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    async with AsyncSessionLocal() as db:
        agent_comp = Agent(id=agent_id_comp, organization_id=org_id, name="Completed Agent", public_key=pk_comp, status="ACTIVE")
        db.add(agent_comp)
        source_comp = KnowledgeSource(
            id=source_id_comp,
            organization_id=org_id,
            agent_id=agent_id_comp,
            type="WEBSITE",
            url="https://completed-site.com",
            status="ACTIVE",
            last_successful_crawl_at=now
        )
        db.add(source_comp)
        job_comp = CrawlJob(
            organization_id=org_id,
            agent_id=agent_id_comp,
            knowledge_source_id=source_id_comp,
            status="COMPLETED",
            pages_discovered=10,
            pages_processed=10,
            completed_at=now
        )
        db.add(job_comp)
        await db.commit()

        req7 = WidgetBootstrapRequest(public_key=pk_comp, origin="https://completed-site.com")
        res7 = await CrawlerService.bootstrap_widget(db, req7)
        check("7. Completed crawl: widget_ready=True", res7.widget_ready is True)
        check("7. Completed crawl: knowledge_status='ready'", res7.knowledge_status == "ready")
        check("7. Completed crawl: crawl_triggered=False", res7.crawl_triggered is False)

    # ──────────────────────────────────────────────────────────
    # Test 8: Crawl in Progress (Status RUNNING)
    # ──────────────────────────────────────────────────────────
    print("\n── 8. Crawl in Progress ───────────────────────────────")
    agent_id_run = f"agent_run_{ts}"
    pk_run = f"pk_run_{ts}"
    source_id_run = f"ks_run_{ts}"

    async with AsyncSessionLocal() as db:
        agent_run = Agent(id=agent_id_run, organization_id=org_id, name="Running Agent", public_key=pk_run, status="ACTIVE")
        db.add(agent_run)
        source_run = KnowledgeSource(
            id=source_id_run,
            organization_id=org_id,
            agent_id=agent_id_run,
            type="WEBSITE",
            url="https://running-site.com",
            status="CRAWLING"
        )
        db.add(source_run)
        job_run = CrawlJob(
            organization_id=org_id,
            agent_id=agent_id_run,
            knowledge_source_id=source_id_run,
            status="RUNNING",
            started_at=now
        )
        db.add(job_run)
        await db.commit()

        req8 = WidgetBootstrapRequest(public_key=pk_run, origin="https://running-site.com")
        res8 = await CrawlerService.bootstrap_widget(db, req8)
        check("8. Crawl in progress: widget_ready=True", res8.widget_ready is True)
        check("8. Crawl in progress: knowledge_status='processing'", res8.knowledge_status == "processing")
        check("8. Crawl in progress: crawl_triggered=False", res8.crawl_triggered is False)

    # ──────────────────────────────────────────────────────────
    # Test 9: Failed Crawl (Cooldown Active)
    # ──────────────────────────────────────────────────────────
    print("\n── 9. Failed Crawl (Cooldown Active) ──────────────────")
    agent_id_fail = f"agent_fail_{ts}"
    pk_fail = f"pk_fail_{ts}"
    source_id_fail = f"ks_fail_{ts}"

    async with AsyncSessionLocal() as db:
        agent_fail = Agent(id=agent_id_fail, organization_id=org_id, name="Failed Agent", public_key=pk_fail, status="ACTIVE")
        db.add(agent_fail)
        source_fail = KnowledgeSource(
            id=source_id_fail,
            organization_id=org_id,
            agent_id=agent_id_fail,
            type="WEBSITE",
            url="https://failed-site.com",
            status="FAILED"
        )
        db.add(source_fail)
        job_fail = CrawlJob(
            organization_id=org_id,
            agent_id=agent_id_fail,
            knowledge_source_id=source_id_fail,
            status="FAILED",
            error_summary="Connection timed out",
            completed_at=now  # just completed 0s ago -> cooldown active
        )
        db.add(job_fail)
        await db.commit()

        req9 = WidgetBootstrapRequest(public_key=pk_fail, origin="https://failed-site.com")
        res9 = await CrawlerService.bootstrap_widget(db, req9)
        check("9. Failed crawl during cooldown: knowledge_status='failed'", res9.knowledge_status == "failed")
        check("9. Failed crawl during cooldown: crawl_triggered=False", res9.crawl_triggered is False)

    # ──────────────────────────────────────────────────────────
    # Test 10: Retry Failed Crawl (Explicit force_retry=True)
    # ──────────────────────────────────────────────────────────
    print("\n── 10. Retry Failed Crawl ────────────────────────────")
    async with AsyncSessionLocal() as db:
        req10 = WidgetBootstrapRequest(
            public_key=pk_fail,
            origin="https://failed-site.com",
            force_retry=True
        )
        res10 = await CrawlerService.bootstrap_widget(db, req10)
        check("10. Retry with force_retry: crawl_triggered=True", res10.crawl_triggered is True)
        check("10. Retry: knowledge_status='processing'", res10.knowledge_status == "processing")
        check("10. Retry: new job ID generated", res10.crawl_job_id is not None and res10.crawl_job_id != job_fail.id)

    # ──────────────────────────────────────────────────────────
    # Summary
    # ──────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    total = len(results)
    print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
    if failed > 0:
        print("\n  FAILED TESTS:")
        for name, ok in results.items():
            if not ok:
                print(f"    ✗ {name}")
        raise SystemExit(1)
    else:
        print(f"\n  [SUCCESS] ALL {total} WIDGET BOOTSTRAP TESTS PASSED!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
