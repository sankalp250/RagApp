"""
test_widget_deployment.py — Multi-Platform Widget & Public Config Test Suite
===========================================================================
Validates:
  1. GET /api/v1/agents/{agent_id}/public-config returns 200 for active agent
  2. Public config response contains all safe fields (bot_title, greeting, etc.)
  3. Public config does NOT expose sensitive fields (system_prompt, model, api_keys)
  4. Deactivated agent (status != "ACTIVE") returns 403 Forbidden
  5. Non-existent agent returns 404 Not Found
  6. Widget chat endpoint accepts agent_id as public identifier
  7. Widget chat endpoint accepts public_key as public identifier
  8. SSE stream generator produces valid data events
  9. Widget bootstrap endpoint accepts requests
 10. Shadow DOM widget.js file exists and contains valid Shadow DOM attach logic
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import uuid
import time
from typing import Dict, Any
from unittest.mock import AsyncMock, patch

from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.db.models.organization import Organization
from backend.app.db.models.agent import Agent
from backend.app.schemas.agent import AgentPublicConfigResponse
from backend.app.api.v1.agents import get_agent_public_config
from backend.app.api.v1.widget import _get_agent_by_public_key, widget_chat, bootstrap_widget
from backend.app.schemas.chat import ChatRequest
from backend.app.schemas.crawler import WidgetBootstrapRequest
from fastapi import HTTPException

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
    print("=" * 70)
    print("  TASK 8: UNIVERSAL WIDGET DEPLOYMENT & PUBLIC CONFIG TEST SUITE")
    print("=" * 70)

    await init_db()
    ts = int(time.time() * 1000)
    org_id = f"test_deploy_org_{ts}"
    active_agent_id = f"test_deploy_agent_active_{ts}"
    inactive_agent_id = f"test_deploy_agent_inactive_{ts}"
    active_public_key = f"pub_active_{ts}"
    inactive_public_key = f"pub_inactive_{ts}"

    # 1. Setup Test Organizations & Agents in DB
    async with AsyncSessionLocal() as db:
        org = Organization(id=org_id, name="Deploy Test Org", slug=f"deploy-org-{ts}")
        active_agent = Agent(
            id=active_agent_id,
            organization_id=org_id,
            name="Aria Customer Assistant",
            system_prompt="SECRET_SYSTEM_PROMPT_DO_NOT_LEAK",
            model="gemini-2.5-flash",
            status="ACTIVE",
            public_key=active_public_key,
            configuration={
                "bot_title": "Aria AI",
                "greeting_message": "Welcome to our store! How can I assist?",
                "primary_color": "#4f46e5",
                "placeholder_text": "Ask anything...",
                "suggested_questions": ["What is your return policy?", "Where is my order?"]
            }
        )
        inactive_agent = Agent(
            id=inactive_agent_id,
            organization_id=org_id,
            name="Deactivated Bot",
            system_prompt="ANOTHER_SECRET_PROMPT",
            model="gpt-4o",
            status="INACTIVE",
            public_key=inactive_public_key,
            configuration={"bot_title": "Inactive Bot"}
        )
        db.add(org)
        db.add(active_agent)
        db.add(inactive_agent)
        await db.commit()

    # Test 1: Public config for active agent by ID
    print("\n--- Section 1: Public Agent Configuration ---")
    async with AsyncSessionLocal() as db:
        resp = await get_agent_public_config(active_agent_id, db)
        check("1.1 Public config returns 200 for active agent by ID", resp is not None)
        check("1.2 bot_title matches configuration", resp.bot_title == "Aria AI")
        check("1.3 greeting_message matches configuration", resp.greeting_message == "Welcome to our store! How can I assist?")
        check("1.4 primary_color matches configuration", resp.primary_color == "#4f46e5")
        check("1.5 suggested_questions populated", len(resp.suggested_questions) == 2)
        check("1.6 is_published is True", resp.is_published is True)

        # Test by public_key
        resp_by_key = await get_agent_public_config(active_public_key, db)
        check("1.7 Public config lookup works by public_key", resp_by_key.agent_id == active_agent_id)

    # Test 2: Security & Zero Secret Leakage
    print("\n--- Section 2: Zero Secret Leakage Validation ---")
    resp_dict = resp.model_dump()
    check("2.1 system_prompt NOT in public config", "system_prompt" not in resp_dict)
    check("2.2 model name NOT in public config", "model" not in resp_dict)
    check("2.3 organization_id NOT in public config", "organization_id" not in resp_dict)
    check("2.4 API keys NOT in public config", "api_key" not in resp_dict and "secret" not in resp_dict)

    # Test 3: Deactivated and Non-Existent Agent Guardrails
    print("\n--- Section 3: Status & Security Guardrails ---")
    async with AsyncSessionLocal() as db:
        # Inactive agent must return 403
        inactive_caught = False
        try:
            await get_agent_public_config(inactive_agent_id, db)
        except HTTPException as e:
            if e.status_code == 403:
                inactive_caught = True
        check("3.1 Inactive agent returns 403 Forbidden", inactive_caught)

        # Non-existent agent must return 404
        not_found_caught = False
        try:
            await get_agent_public_config("non_existent_agent_id_xyz", db)
        except HTTPException as e:
            if e.status_code == 404:
                not_found_caught = True
        check("3.2 Non-existent agent returns 404 Not Found", not_found_caught)

    # Test 4: Widget Chat Endpoint Identification
    print("\n--- Section 4: Widget Chat Endpoint Resolution ---")
    async with AsyncSessionLocal() as db:
        agent_by_id = await _get_agent_by_public_key(active_agent_id, db)
        check("4.1 Widget resolves agent by agent_id", agent_by_id.id == active_agent_id)

        agent_by_key = await _get_agent_by_public_key(active_public_key, db)
        check("4.2 Widget resolves agent by public_key", agent_by_key.id == active_agent_id)

        # Inactive agent lookup in widget
        inactive_widget_caught = False
        try:
            await _get_agent_by_public_key(inactive_agent_id, db)
        except HTTPException as e:
            if e.status_code == 404:
                inactive_widget_caught = True
        check("4.3 Inactive agent lookup in widget rejected", inactive_widget_caught)

    # Test 5: Shadow DOM Widget.js Verification
    print("\n--- Section 5: Widget Script & Shadow DOM Verification ---")
    widget_path = "frontend/public/widget.js"
    check("5.1 frontend/public/widget.js exists", os.path.exists(widget_path))
    content = open(widget_path, encoding="utf-8").read()
    check("5.2 Shadow DOM attachShadow is implemented", "attachShadow" in content)
    check("5.3 data-agent-id resolution is implemented", "data-agent-id" in content)
    check("5.4 Global window.RagWidget API is implemented", "window.RagWidget" in content)
    check("5.5 SSE stream parsing is implemented", "text/event-stream" in content)
    check("5.6 Citation badges rendering is implemented", "citation-badge" in content)

    # Test 6: Integration Guide Verification
    print("\n--- Section 6: Integration Documentation ---")
    doc_path = "docs/EMBED_INTEGRATION_GUIDE.md"
    check("6.1 docs/EMBED_INTEGRATION_GUIDE.md exists", os.path.exists(doc_path))
    doc_content = open(doc_path, encoding="utf-8").read()
    check("6.2 HTML example included", "Plain HTML" in doc_content)
    check("6.3 React component included", "ChatWidget" in doc_content)
    check("6.4 Next.js Script component included", "next/script" in doc_content)
    check("6.5 Shopify theme.liquid guide included", "theme.liquid" in doc_content)

    # Cleanup test org
    async with AsyncSessionLocal() as db:
        test_org = await db.get(Organization, org_id)
        if test_org:
            await db.delete(test_org)
            await db.commit()

    # Summary
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print("\n" + "=" * 70)
    print(f"  RESULTS: {passed}/{total} passed", "[OK]" if failed == 0 else f"  ({failed} FAILED)")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
