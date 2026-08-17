"""
Analytics API
=============
Dashboard endpoints for knowledge gap analysis, conversation insights, and
evaluation metrics. Only accessible by authenticated organization members.

Endpoints:
  GET /analytics/knowledge-gaps           - Top knowledge gaps for the org
  GET /analytics/agents/{id}/knowledge-gaps - Gaps for a specific agent
  GET /analytics/agents/{id}/conversations  - Recent conversations summary
  GET /analytics/agents/{id}/stats          - Agent usage statistics
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.api.deps import get_db, get_current_user
from backend.app.db.models.user import User
from backend.app.db.models.knowledge_gap import KnowledgeGap
from backend.app.db.models.conversation import Conversation, Message
from backend.app.db.models.evaluation import Feedback
from backend.app.ai.knowledge_gap import get_knowledge_gap_stats

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
    """Summary metrics for a single agent: conversations, messages, gap rate, avg latency."""
    org_id = current_user.organization_id

    # Total conversations
    conv_count = await db.scalar(
        select(func.count(Conversation.id)).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id
        )
    )

    # Total messages (user + assistant)
    msg_count = await db.scalar(
        select(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id
        )
    )

    # Average latency (assistant messages only)
    avg_latency = await db.scalar(
        select(func.avg(Message.latency_ms)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            Conversation.agent_id == agent_id,
            Conversation.organization_id == org_id,
            Message.role == "assistant"
        )
    )

    # Knowledge gap rate
    gap_count = await db.scalar(
        select(func.count(KnowledgeGap.id)).where(
            KnowledgeGap.agent_id == agent_id,
            KnowledgeGap.organization_id == org_id,
            KnowledgeGap.status == "OPEN"
        )
    )

    # Average feedback rating
    avg_rating = await db.scalar(
        select(func.avg(Feedback.rating)).join(
            Message, Feedback.message_id == Message.id
        ).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(Conversation.agent_id == agent_id)
    )

    return {
        "agent_id": agent_id,
        "total_conversations": conv_count or 0,
        "total_messages": msg_count or 0,
        "avg_latency_ms": round(avg_latency or 0, 2),
        "open_knowledge_gaps": gap_count or 0,
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
