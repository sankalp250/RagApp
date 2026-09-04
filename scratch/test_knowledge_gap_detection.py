"""
test_knowledge_gap_detection.py — Knowledge Gap Detection & Semantic Clustering Test Suite
========================================================================================
Validates:
  1. Multi-signal failure evaluation (retrieval, grounding, ignorance, feedback, repeated questions)
  2. Grounded, high-quality responses are NOT classified as gaps
  3. Semantic vector clustering groups multiple phrasing variations into 1 consolidated Topic
  4. Failure aggregation (occurrence_count, sample_questions list, confidence score)
  5. Distinct topics remain separate (e.g. Address Changes vs Crypto Payments)
  6. Feedback-driven re-evaluation elevates gap confidence
  7. Dashboard API returns full rich schema contract
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
import uuid
import time
from typing import Dict, Any, List
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.db.models.organization import Organization
from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Conversation, Message, RetrievalEvidence
from backend.app.db.models.evaluation import Evaluation
from backend.app.db.models.knowledge_gap import KnowledgeGap, GapEvidence
from backend.app.schemas.chat import SourceChunk
from backend.app.ai.evaluator import (
    evaluate_response, detect_ignorance_admission, detect_repeated_user_query,
    compute_retrieval_score, compute_grounding_score
)
from backend.app.ai.knowledge_gap import (
    record_knowledge_gap_with_clustering, get_knowledge_gap_stats,
    synthesize_topic_title, _cosine_similarity
)
from backend.app.workers.evaluation_jobs import run_evaluation_job, re_evaluate_with_feedback
from backend.app.api.v1.analytics import list_knowledge_gaps
from backend.app.db.models.user import User

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
    print("  TASK 9: KNOWLEDGE GAP DETECTION & SEMANTIC CLUSTERING TEST SUITE")
    print("=" * 75)

    await init_db()
    ts = int(time.time() * 1000)
    org_id = f"test_kg_org_{ts}"
    agent_id = f"test_kg_agent_{ts}"

    # 1. Setup Test Tenant & Agent
    async with AsyncSessionLocal() as db:
        org = Organization(id=org_id, name="KG Test Org", slug=f"kg-org-{ts}")
        agent = Agent(
            id=agent_id,
            organization_id=org_id,
            name="Support Assistant",
            system_prompt="Helpful assistant",
            model="gemini-2.5-flash",
            status="ACTIVE"
        )
        user = User(
            id=f"user_kg_{ts}",
            email=f"tester_{ts}@example.com",
            hashed_password="hash",
            primary_organization_id=org_id
        )
        db.add(org)
        db.add(agent)
        db.add(user)
        await db.commit()

    # Section 1: Multi-Signal Evaluator Unit Tests
    print("\n--- Section 1: Multi-Signal Evaluation ---")
    
    # 1.1 Ignorance Detection
    check("1.1 detect_ignorance_admission on 'I don't have information about that'", 
          detect_ignorance_admission("I don't have information about that in my records."))
    check("1.2 detect_ignorance_admission on 'not mentioned in the context'", 
          detect_ignorance_admission("That topic is not mentioned in our knowledge base."))
    check("1.3 detect_ignorance_admission negative on normal answer", 
          not detect_ignorance_admission("You can return items within 30 days of delivery."))

    # 1.2 Repeated Query Detection
    history = [
        {"role": "user", "content": "How do I change my shipping address?"},
        {"role": "assistant", "content": "I am not sure."},
    ]
    check("1.4 detect_repeated_user_query detects similar re-prompt",
          detect_repeated_user_query(history, "Can I modify my shipping address?"))
    check("1.5 detect_repeated_user_query ignores distinct topic",
          not detect_repeated_user_query(history, "What is your refund policy?"))

    # 1.3 High Quality Response Evaluation
    grounded_chunks = [
        SourceChunk(chunk_id="c1", content="Our return policy allows 30 days for full refund.", similarity_score=0.92, rank=1),
        SourceChunk(chunk_id="c2", content="Items must be in original condition.", similarity_score=0.88, rank=2)
    ]
    good_eval = evaluate_response(
        answer="According to our return policy, you can return items within 30 days for a full refund.",
        source_chunks=grounded_chunks,
        user_query="What is your return policy?"
    )
    check("1.6 High quality response is NOT a failure candidate", not good_eval["is_failure_candidate"])
    check("1.7 High quality composite score >= 0.70", good_eval["composite_score"] >= 0.70, f"score={good_eval['composite_score']}")

    # 1.4 Low Retrieval / Zero Context Evaluation
    bad_eval_empty = evaluate_response(
        answer="I cannot find information on international shipping to Mars.",
        source_chunks=[],
        user_query="Do you ship to Mars?"
    )
    check("1.8 Zero retrieved chunks flagged as failure candidate", bad_eval_empty["is_failure_candidate"])
    check("1.9 Category is NO_RELEVANT_DOCUMENTS", bad_eval_empty["failure_category"] == "NO_RELEVANT_DOCUMENTS")

    # Section 2: Topic Synthesis
    print("\n--- Section 2: Semantic Topic Synthesis ---")
    t1 = synthesize_topic_title("Can I change delivery address?")
    check("2.1 Synthesizes address topic", "Address" in t1, f"topic='{t1}'")
    
    t2 = synthesize_topic_title("How do I request a refund or exchange?")
    check("2.2 Synthesizes returns/refunds topic", "Refund" in t2 or "Return" in t2, f"topic='{t2}'")
    
    t3 = synthesize_topic_title("Where can I download API webhook SDKs?")
    check("2.3 Synthesizes developer API topic", "API" in t3 or "Webhook" in t3, f"topic='{t3}'")

    # Section 3: Semantic Clustering of Repeated Question Variations
    print("\n--- Section 3: Semantic Clustering of Repeated Failures ---")
    
    address_queries = [
        ("Can I change delivery address?", "msg_addr_1"),
        ("Can I modify shipping address?", "msg_addr_2"),
        ("Can I redirect my order destination?", "msg_addr_3"),
        ("Can the courier change my delivery address?", "msg_addr_4"),
    ]

    async with AsyncSessionLocal() as db:
        for q_text, m_id in address_queries:
            # Create a conversation and message
            conv = Conversation(agent_id=agent_id, organization_id=org_id, visitor_id="v1")
            db.add(conv)
            await db.flush()
            
            user_msg = Message(conversation_id=conv.id, role="user", content=q_text)
            asst_msg = Message(conversation_id=conv.id, role="assistant", content="I do not have information on address changes.")
            db.add(user_msg)
            db.add(asst_msg)
            await db.flush()
            
            # Record with clustering
            await record_knowledge_gap_with_clustering(
                db=db,
                agent_id=agent_id,
                organization_id=org_id,
                message_id=str(asst_msg.id),
                user_query=q_text,
                gap_category="MODEL_ADMITTED_IGNORANCE",
                source_chunks=[],
                retrieval_score=0.1,
                grounding_score=0.1,
                answer_quality_score=0.2
            )

    # Verify clustering results
    async with AsyncSessionLocal() as db:
        stmt = select(KnowledgeGap).where(KnowledgeGap.agent_id == agent_id, KnowledgeGap.status == "OPEN")
        result = await db.execute(stmt)
        gaps = result.scalars().all()

        check("3.1 All 4 address queries clustered into EXACTLY 1 KnowledgeGap", len(gaps) == 1, f"total_gaps={len(gaps)}")
        if gaps:
            gap = gaps[0]
            check("3.2 Occurrence count aggregated to 4", gap.frequency == 4, f"freq={gap.frequency}")
            check("3.3 Sample questions contains multiple unique variations", len(gap.sample_questions) >= 3, f"samples={gap.sample_questions}")
            check("3.4 Confidence elevated above 0.70", gap.confidence >= 0.70, f"confidence={gap.confidence}")
            check("3.5 Topic title is clean and descriptive", "Address" in gap.topic, f"topic='{gap.topic}'")
            check("3.6 Recommended action populated", gap.recommended_action is not None and len(gap.recommended_action) > 10)

    # Section 4: Distinct Topic Separation (No Over-Clustering)
    print("\n--- Section 4: Distinct Topic Separation ---")
    async with AsyncSessionLocal() as db:
        # Send unrelated crypto query
        crypto_q = "Do you accept Bitcoin or Ethereum payments?"
        conv = Conversation(agent_id=agent_id, organization_id=org_id, visitor_id="v2")
        db.add(conv)
        await db.flush()
        asst_msg = Message(conversation_id=conv.id, role="assistant", content="I have no information regarding crypto payments.")
        db.add(asst_msg)
        await db.flush()

        await record_knowledge_gap_with_clustering(
            db=db,
            agent_id=agent_id,
            organization_id=org_id,
            message_id=str(asst_msg.id),
            user_query=crypto_q,
            gap_category="NO_RELEVANT_DOCUMENTS",
            source_chunks=[],
            retrieval_score=0.0,
            grounding_score=0.1,
            answer_quality_score=0.2
        )

        stmt = select(KnowledgeGap).where(KnowledgeGap.agent_id == agent_id, KnowledgeGap.status == "OPEN")
        result = await db.execute(stmt)
        all_gaps = result.scalars().all()

        check("4.1 Crypto payment forms a separate 2nd KnowledgeGap", len(all_gaps) == 2, f"total_gaps={len(all_gaps)}")
        topics = [g.topic for g in all_gaps]
        check("4.2 Both distinct topics present in database", any("Address" in t for t in topics) and any("Payment" in t or "Bitcoin" in t or "Inquiries" in t for t in topics), f"topics={topics}")

    # Section 5: End-to-End Async Evaluation Worker
    print("\n--- Section 5: Async Evaluation Worker Execution ---")
    async with AsyncSessionLocal() as db:
        conv = Conversation(agent_id=agent_id, organization_id=org_id, visitor_id="v3")
        db.add(conv)
        await db.flush()
        u_msg = Message(conversation_id=conv.id, role="user", content="Can I get a discount code?")
        a_msg = Message(conversation_id=conv.id, role="assistant", content="I cannot find any promo codes.")
        db.add(u_msg)
        db.add(a_msg)
        await db.commit()
        a_msg_id = str(a_msg.id)

    # Run background evaluation job
    await run_evaluation_job(a_msg_id)

    async with AsyncSessionLocal() as db:
        eval_record = (await db.execute(select(Evaluation).where(Evaluation.message_id == a_msg_id))).scalars().first()
        check("5.1 Evaluation record created asynchronously", eval_record is not None)
        check("5.2 Evaluation flagged potential_gap = True", eval_record.potential_gap is True)

        # Test re-evaluation with negative human feedback (thumbs down)
        await re_evaluate_with_feedback(a_msg_id, feedback_rating=1, comment="Bot did not help with coupon")
        await db.refresh(eval_record)
        check("5.3 Feedback rating recorded in evaluation signals", eval_record.signals.get("feedback_rating") == 1)

    # Section 6: Dashboard Analytics API Schema
    print("\n--- Section 6: Dashboard Analytics API ---")
    async with AsyncSessionLocal() as db:
        dashboard_res = await list_knowledge_gaps(
            agent_id=agent_id,
            status="OPEN",
            limit=20,
            db=db,
            current_user=user
        )
        check("6.1 Dashboard returns gaps list", "gaps" in dashboard_res and dashboard_res["total"] >= 2)
        top_gap = dashboard_res["gaps"][0]
        check("6.2 Top gap has topic field", "topic" in top_gap and top_gap["topic"] is not None)
        check("6.3 Top gap has occurrence_count field", "occurrence_count" in top_gap and top_gap["occurrence_count"] >= 1)
        check("6.4 Top gap has sample_questions list", "sample_questions" in top_gap and isinstance(top_gap["sample_questions"], list))
        check("6.5 Top gap has confidence field", "confidence" in top_gap and 0.0 <= top_gap["confidence"] <= 1.0)
        check("6.6 Top gap has retrieval_metrics", "retrieval_metrics" in top_gap)
        check("6.7 Top gap has first_seen and last_seen timestamps", "first_seen" in top_gap and "last_seen" in top_gap)
        check("6.8 Top gap has recommended_action", "recommended_action" in top_gap and len(top_gap["recommended_action"]) > 5)

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

    print("\n" + "=" * 75)
    print(f"  RESULTS: {passed}/{total} passed", "[OK]" if failed == 0 else f"  ({failed} FAILED)")
    print("=" * 75)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
