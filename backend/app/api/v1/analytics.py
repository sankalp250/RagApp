"""
Analytics API
=============
Dashboard endpoints for knowledge gap analysis, conversation insights, and
evaluation metrics. Only accessible by authenticated organization members.

Endpoints:
  GET  /analytics/knowledge-gaps              - Top knowledge gaps for the org
  GET  /analytics/agents/{id}/conversations   - Recent conversations summary
  GET  /analytics/agents/{id}/stats           - Agent usage statistics (parallel queries)
  GET  /analytics/agents/{id}/health          - Knowledge health report
  POST /analytics/knowledge-gaps/{id}/recommend - Generate AI recommendation
  POST /analytics/score-gaps                  - Batch re-score all gaps
  GET  /analytics/overview                    - Org dashboard (2 parallel DB calls)
"""
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.api.deps import get_db, get_current_user
from backend.app.db.models.user import User
from backend.app.db.models.knowledge_gap import KnowledgeGap
from backend.app.db.models.conversation import Conversation, Message
from backend.app.db.models.evaluation import Feedback
from backend.app.ai.intelligence import (
    get_knowledge_health_report,
    enrich_gap_with_recommendation,
    score_all_gaps
)

router = APIRouter()


@router.get(
    "/knowledge-gaps",
    summary="Get top knowledge gaps for the organization"
)
async def list_knowledge_gaps(
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    status: Optional[str] = Query("OPEN", description="Filter by status: OPEN, REVIEWED, RESOLVED"),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns knowledge gaps ranked by frequency.
    Use this to understand what customers are asking that the agent can't answer.
    """
    stmt = (
        select(KnowledgeGap)
        .where(KnowledgeGap.organization_id == current_user.organization_id)
        .order_by(desc(KnowledgeGap.frequency), desc(KnowledgeGap.created_at))
        .limit(limit)
    )
    if agent_id:
        stmt = stmt.where(KnowledgeGap.agent_id == agent_id)
    if status:
        stmt = stmt.where(KnowledgeGap.status == status)

    result = await db.execute(stmt)
    gaps = result.scalars().all()

    return {
        "total": len(gaps),
        "gaps": [
            {
                "id": str(g.id),
                "query": g.query,
                "category": g.category,
                "frequency": g.frequency,
                "status": g.status,
                "agent_id": g.agent_id,
                "created_at": g.created_at.isoformat() if g.created_at else None,
                "recommended_action": g.recommended_action
            }
            for g in gaps
        ]
    }


@router.patch(
    "/knowledge-gaps/{gap_id}",
    summary="Update a knowledge gap status"
)
async def update_knowledge_gap(
    gap_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a gap as REVIEWED or RESOLVED."""
    stmt = select(KnowledgeGap).where(
        KnowledgeGap.id == gap_id,
        KnowledgeGap.organization_id == current_user.organization_id
    )
    result = await db.execute(stmt)
    gap = result.scalars().first()
    if not gap:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Knowledge gap not found.")

    valid_statuses = {"OPEN", "REVIEWED", "RESOLVED"}
    if status not in valid_statuses:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    gap.status = status
    await db.commit()
    return {"id": gap_id, "status": status}


@router.get(
    "/agents/{agent_id}/stats",
    summary="Agent usage and performance statistics"
)
async def get_agent_stats(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Summary metrics for a single agent: conversations, messages, gap rate, avg latency.
    Consolidated into a single aggregation statement (1 DB round-trip, 0 session concurrency hazards).
    """
    org_id = current_user.organization_id

    stmt = select(
        select(func.count(Conversation.id)).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id
        ).scalar_subquery().label("conv_count"),
        select(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id
        ).scalar_subquery().label("msg_count"),
        select(func.avg(Message.latency_ms)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id,
            Message.role == "assistant"
        ).scalar_subquery().label("avg_latency"),
        select(func.count(KnowledgeGap.id)).where(
            KnowledgeGap.agent_id == agent_id,
            KnowledgeGap.organization_id == org_id,
            KnowledgeGap.status == "OPEN"
        ).scalar_subquery().label("gap_count"),
        select(func.avg(Feedback.rating)).join(
            Message, Feedback.message_id == Message.id
        ).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            Conversation.agent_id == agent_id
        ).scalar_subquery().label("avg_rating")
    )

    result = await db.execute(stmt)
    row = result.mappings().first() or {}

    conv_count = row.get("conv_count") or 0
    msg_count = row.get("msg_count") or 0
    avg_latency = row.get("avg_latency")
    gap_count = row.get("gap_count") or 0
    avg_rating = row.get("avg_rating")

    return {
        "agent_id": agent_id,
        "total_conversations": conv_count,
        "total_messages": msg_count,
        "avg_latency_ms": round(avg_latency or 0, 2),
        "open_knowledge_gaps": gap_count,
        "avg_feedback_rating": round(avg_rating or 0, 2),
    }


@router.get(
    "/agents/{agent_id}/conversations",
    summary="List recent conversations for an agent"
)
async def list_conversations(
    agent_id: str,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return recent conversations with message count."""
    stmt = (
        select(Conversation)
        .where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == current_user.organization_id
        )
        .order_by(desc(Conversation.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    convs = result.scalars().all()

    return {
        "total": len(convs),
        "conversations": [
            {
                "id": str(c.id),
                "visitor_id": c.visitor_id,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in convs
        ]
    }


# ─── Phase 7: Intelligence Endpoints ─────────────────────────────────────────

@router.get(
    "/agents/{agent_id}/health",
    summary="Knowledge health report for an agent"
)
async def agent_health_report(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a comprehensive knowledge health report:
    - health_score (0-100)
    - total / open / resolved gap counts
    - category breakdown (NO_DOCS, LOW_CONFIDENCE, ADMITTED_IGNORANCE)
    - top 5 most frequent unanswered questions
    """
    return await get_knowledge_health_report(
        db=db,
        organization_id=current_user.organization_id,
        agent_id=agent_id
    )


@router.get(
    "/health",
    summary="Org-wide knowledge health report"
)
async def org_health_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns knowledge health across the entire organization."""
    return await get_knowledge_health_report(
        db=db,
        organization_id=current_user.organization_id
    )


@router.post(
    "/knowledge-gaps/{gap_id}/recommend",
    summary="Generate AI recommendation for a knowledge gap"
)
async def recommend_for_gap(
    gap_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uses Gemini AI to analyse the gap and related queries, then generates
    a concrete recommendation for what documentation to add.
    Result is saved to the gap record for future reference.
    """
    recommendation = await enrich_gap_with_recommendation(
        db=db,
        gap_id=gap_id,
        organization_id=current_user.organization_id
    )
    if recommendation is None:
        raise HTTPException(status_code=404, detail="Knowledge gap not found.")

    return {"gap_id": gap_id, "recommendation": recommendation}


@router.get(
    "/overview",
    summary="Get complete real-time dashboard overview metrics for the organization"
)
async def get_overview_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns live aggregated metrics, counts, and health for the authenticated organization.
    Consolidated into a single unified SQL query + 1 recent conversations query (100% async session safe).
    """
    org_id = current_user.organization_id

    from backend.app.db.models.agent import Agent
    from backend.app.db.models.document import Document, DocumentChunk

    unified_stmt = select(
        select(func.count(Agent.id)).where(Agent.organization_id == org_id).scalar_subquery().label("agents_count"),
        select(func.count(Document.id)).where(Document.organization_id == org_id).scalar_subquery().label("docs_count"),
        select(func.count(DocumentChunk.id)).join(Document, DocumentChunk.document_id == Document.id).where(Document.organization_id == org_id).scalar_subquery().label("chunks_count"),
        select(func.count(Conversation.id)).where(Conversation.organization_id == org_id).scalar_subquery().label("conv_count"),
        select(func.count(func.distinct(Conversation.visitor_id))).where(Conversation.organization_id == org_id).scalar_subquery().label("unique_users"),
        select(func.avg(Message.latency_ms)).join(Conversation, Message.conversation_id == Conversation.id).where(Conversation.organization_id == org_id, Message.role == "assistant").scalar_subquery().label("avg_latency"),
        select(func.count(KnowledgeGap.id)).where(KnowledgeGap.organization_id == org_id, KnowledgeGap.status == "OPEN").scalar_subquery().label("gap_count")
    )

    agg_result = await db.execute(unified_stmt)
    agg = agg_result.mappings().first() or {}

    recent_result = await db.execute(
        select(Conversation)
        .where(Conversation.organization_id == org_id)
        .order_by(desc(Conversation.created_at))
        .limit(5)
    )
    recent_convs = recent_result.scalars().all()

    agents_count = agg.get("agents_count") or 0
    docs_count = agg.get("docs_count") or 0
    chunks_count = agg.get("chunks_count") or 0
    conv_count = agg.get("conv_count") or 0
    unique_users = agg.get("unique_users") or 0
    avg_latency = agg.get("avg_latency")
    gap_count = agg.get("gap_count") or 0

    return {
        "agents_count": agents_count,
        "documents_count": docs_count,
        "chunks_count": chunks_count,
        "conversations_count": conv_count,
        "unique_users_count": unique_users,
        "resolution_rate": f"{(100 - (gap_count * 5)):.1f}%" if conv_count > 0 else "--",
        "avg_latency": f"{(avg_latency / 1000):.2f}s" if avg_latency else "--",
        "knowledge_gaps_count": gap_count,
        "health_score": max(0, 100 - (gap_count * 10)) if (docs_count > 0 or conv_count > 0) else 100,
        "is_fresh_account": (agents_count == 0 and docs_count == 0 and conv_count == 0),
        "recent_conversations": [
            {
                "id": str(c.id),
                "title": f"Session #{str(c.id)[:8]}",
                "visitor_id": c.visitor_id,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in recent_convs
        ]
    }


@router.post(
    "/score-gaps",
    summary="Batch re-score all knowledge gaps"
)
async def batch_score_gaps(
    agent_id: Optional[str] = Query(None, description="Scope to a specific agent"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recalculates gap_score for all OPEN gaps in the organization.
    Run this periodically or after adding new documents to the knowledge base.
    """
    updated = await score_all_gaps(
        db=db,
        organization_id=current_user.organization_id
    )
    return {"updated_gaps": updated, "message": f"Scored {updated} open knowledge gaps."}


