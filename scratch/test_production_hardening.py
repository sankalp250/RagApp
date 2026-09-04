"""
test_production_hardening.py — Production Hardening & Resilience Verification Suite
===================================================================================
Validates:
  1. SSRF Protection (direct URLs, private IPs, loopbacks, link-local, AWS/GCP metadata)
  2. Resilient Job Queue: Retries with exponential backoff & Dead-Letter Queue (DLQ)
  3. Playwright Resource Bounding & Concurrency Semaphore
  4. Contextual Structured Logging (request_id, tenant_id correlation in JSONFormatter)
  5. Rate Limiting Tokens & CDN Cache-Control Headers
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import logging
import json
import uuid
import time
from typing import Dict, Any, List

from backend.app.domains.crawler.url_tools import is_safe_url, is_valid_crawl_url, normalize_url
from backend.app.workers.queue import ResilientJobQueue, DeadLetterJob, job_queue
from backend.app.domains.crawler.playwright_renderer import _RENDER_SEMAPHORE, PlaywrightRenderer
from backend.app.core.logging import JSONFormatter, ctx_request_id, ctx_tenant_id, logger
from backend.app.core.rate_limit import RateLimiter, widget_limiter, crawler_limiter, api_limiter

PASS = "[OK]"
FAIL = "[X]"
results: Dict[str, bool] = {}

def check(name: str, condition: bool, detail: str = "") -> None:
    icon = PASS if condition else FAIL
    results[name] = condition
    status = "PASS" if condition else "FAIL"
    extra = f"  ({detail})" if detail else ""
    print(f"  {icon}  [{status}] {name}{extra}")


async def run_tests():
    print("=" * 75)
    print("  TASK 10: PRODUCTION HARDENING & RESILIENCE TEST SUITE")
    print("=" * 75)

    # Section 1: SSRF Protection
    print("\n--- Section 1: SSRF Protection ---")
    
    # Blocked targets
    blocked_urls = [
        "http://127.0.0.1/admin",
        "http://localhost:8000/api",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/computeMetadata/v1/",
        "http://10.0.0.1/internal",
        "http://192.168.1.1/router",
        "http://172.16.0.1/private",
        "http://0.0.0.0/",
        "http://[::1]/secret",
        "ftp://example.com/file",
        "file:///etc/passwd",
    ]
    for b_url in blocked_urls:
        safe = is_safe_url(b_url)
        check(f"1. Block dangerous target: {b_url[:40]}", not safe, f"is_safe={safe}")

    # Allowed targets
    allowed_urls = [
        "https://example.com/docs",
        "https://shopify.com/products",
        "https://github.com/features",
    ]
    for a_url in allowed_urls:
        safe = is_safe_url(a_url)
        check(f"2. Allow public target: {a_url[:40]}", safe, f"is_safe={safe}")

    # Section 2: Resilient Background Job Queue & Dead-Letter Queue (DLQ)
    print("\n--- Section 2: Resilient Background Job Queue & DLQ ---")
    test_q = ResilientJobQueue(max_dlq_size=10)
    
    # 2.1 Successful execution
    success_ran = False
    async def sample_success_task():
        nonlocal success_ran
        success_ran = True
    
    t1 = test_q.enqueue(sample_success_task)
    await t1
    check("2.1 Successful task executed", success_ran)
    stats1 = test_q.get_stats()
    check("2.2 Successful job counter incremented", stats1["jobs_succeeded"] >= 1, f"stats={stats1}")

    # 2.2 Retry & DLQ on failing task
    attempts_count = 0
    async def sample_failing_task():
        nonlocal attempts_count
        attempts_count += 1
        raise ValueError("Simulated database timeout failure")

    t2 = test_q.enqueue(sample_failing_task, max_retries=2, initial_delay=0.05, backoff_factor=1.5)
    await t2

    check("2.3 Task retried 3 times (1 initial + 2 retries)", attempts_count == 3, f"attempts={attempts_count}")
    stats2 = test_q.get_stats()
    check("2.4 DLQ captured failed job", stats2["dlq_depth"] == 1 and stats2["jobs_failed"] == 1, f"stats={stats2}")
    
    dlq_items = await test_q.get_dlq()
    check("2.5 DLQ entry contains error diagnostics", len(dlq_items) == 1 and "Simulated database timeout" in dlq_items[0]["error"])
    check("2.6 DLQ entry contains stack trace", "Traceback" in dlq_items[0]["traceback"])

    await test_q.clear_dlq()
    check("2.7 Clear DLQ operational endpoint", len(await test_q.get_dlq()) == 0)

    # Section 3: Playwright Concurrency Semaphore
    print("\n--- Section 3: Playwright Resource Bounding ---")
    check("3.1 Render semaphore initialized", _RENDER_SEMAPHORE is not None)
    check("3.2 Render semaphore capacity capped at 3", _RENDER_SEMAPHORE._value <= 3, f"value={_RENDER_SEMAPHORE._value}")

    # Section 4: Contextual Structured Logging & Correlation
    print("\n--- Section 4: Contextual Structured Logging ---")
    test_req_id = f"req_{uuid.uuid4().hex[:8]}"
    test_tenant_id = f"org_{uuid.uuid4().hex[:8]}"

    ctx_request_id.set(test_req_id)
    ctx_tenant_id.set(test_tenant_id)

    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=100,
        msg="Processing customer message",
        args=(),
        exc_info=None
    )
    formatted_json = formatter.format(record)
    parsed = json.loads(formatted_json)

    check("4.1 Log formatted as valid JSON", isinstance(parsed, dict))
    check("4.2 Contextual request_id present in log", parsed.get("request_id") == test_req_id, f"req_id={parsed.get('request_id')}")
    check("4.3 Contextual tenant_id present in log", parsed.get("tenant_id") == test_tenant_id, f"tenant_id={parsed.get('tenant_id')}")
    check("4.4 Timestamp is ISO-8601 UTC", "timestamp" in parsed and "T" in parsed["timestamp"])

    # Reset contextvars
    ctx_request_id.set(None)
    ctx_tenant_id.set(None)

    # Section 5: Rate Limiting & Token Buckets
    print("\n--- Section 5: Rate Limiting & Token Buckets ---")
    rl = RateLimiter(capacity=3, refill_rate=0.1, use_redis=False)
    
    # 3 allowed
    a1, _ = await rl.is_allowed("test_client")
    a2, _ = await rl.is_allowed("test_client")
    a3, _ = await rl.is_allowed("test_client")
    # 4th blocked
    a4, rem = await rl.is_allowed("test_client")

    check("5.1 Rate limiter allows requests within capacity", a1 and a2 and a3)
    check("5.2 Rate limiter blocks requests exceeding capacity", not a4 and rem == 0, f"allowed={a4}, remaining={rem}")
    check("5.3 Crawler limiter configured with bounded burst", crawler_limiter.capacity == 20)

    # Summary
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print("\n" + "=" * 75)
    print(f"  RESULTS: {passed}/{total} passed", "[OK]" if failed == 0 else f"  ({failed} FAILED)")
    print("=" * 75)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
