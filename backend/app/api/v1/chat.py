"""
Chat API Router
===============
Endpoints:
  POST /agents/{agent_id}/chat              - Send a message and get answer (sync or SSE stream)
  GET  /agents/{agent_id}/conversations/{id} - Get conversation history
  POST /messages/{message_id}/feedback      - Submit thumbs-up/down feedback
"""
import json
import asyncio
import time
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_db, get_optional_user, get_current_user
from backend.app.db.models.user import User
from backend.app.db.models.conversation import Conversation, Message
from backend.app.db.models.evaluation import Feedback
from backend.app.schemas.chat import (
    ChatRequest, ChatResponse, FeedbackCreate, ConversationHistoryResponse
)
from backend.app.domains.chat.service import ChatService
from backend.app.workers.evaluation_jobs import re_evaluate_with_feedback
from backend.app.core.exceptions import AgentNotFoundException
from backend.app.core.logging import logger

router = APIRouter()


@router.post(
    "/agents/{agent_id}/chat",
    response_model=ChatResponse,
    summary="Send a chat message to an agent"
)
async def chat_with_agent(
    agent_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Main chat endpoint. Supports both internal (authenticated) and
    widget (anonymous) access via the get_optional_user dependency.

    Set `stream: true` in the request body to receive a Server-Sent Events stream.
    """
    # Resolve organization_id
    # For widget calls (no auth user), we look up organization via agent's public_key context
    # For now we require a logged-in user or rely on the agent's public widget endpoint
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Use the public widget endpoint /widget/{public_key}/chat for anonymous access."
        )

    organization_id = current_user.organization_id

    if request.stream:
        return StreamingResponse(
            _stream_chat(agent_id, organization_id, request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            }
        )

    try:
        response = await ChatService.chat(
            db=db,
            agent_id=agent_id,
            organization_id=organization_id,
            request=request
        )
        return response
    except AgentNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error for agent {agent_id}: {e}", exc_info=e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Chat service error")


async def _stream_chat(
    agent_id: str,
    organization_id: str,
    request: ChatRequest
) -> AsyncGenerator[str, None]:
    """
    SSE generator — runs real-time native token streaming with decoupled database sessions.
    """
    try:
        async for sse_event in ChatService.chat_stream(
            agent_id=agent_id,
            organization_id=organization_id,
            request=request
        ):
            yield f"data: {json.dumps(sse_event)}\n\n"

    except Exception as e:
        logger.error(f"Chat stream error: {e}", exc_info=e)
        yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"


@router.get(
    "/agents/{agent_id}/conversations/{conversation_id}",
    response_model=ConversationHistoryResponse,
    summary="Get conversation history"
)
async def get_conversation(
    agent_id: str,
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """Retrieve all messages in a conversation."""
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    return await ChatService.get_conversation_history(
        db=db,
        agent_id=agent_id,
        organization_id=current_user.organization_id,
        conversation_id=conversation_id
    )


@router.get(
    "/conversations",
    summary="List all conversations for the organization"
)
async def list_conversations(
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns live conversation threads for the organization,
    including visitor info, message history, agent details, and statuses.
    """
    org_id = current_user.organization_id
    from backend.app.db.models.agent import Agent

    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages), selectinload(Conversation.agent))
        .where(Conversation.organization_id == org_id)
        .order_by(desc(Conversation.created_at))
        .limit(limit)
    )
    if agent_id:
        stmt = stmt.where(Conversation.agent_id == agent_id)

    res = await db.execute(stmt)
    convs = res.scalars().all()

    items = []
    for c in convs:
        msgs = [
            {
                "id": str(m.id),
                "sender": "bot" if m.role == "assistant" else "user",
                "role": m.role,
                "text": m.content,
                "time": m.created_at.strftime("%I:%M %p") if m.created_at else "",
                "latency_ms": m.latency_ms
            }
            for m in (c.messages or [])
        ]
        last_msg = msgs[-1]["text"] if msgs else "No messages recorded"
        items.append({
            "id": str(c.id),
            "customerName": f"Visitor #{c.visitor_id[:8]}" if c.visitor_id else f"Session #{str(c.id)[:8]}",
            "channel": f"{c.agent.name if c.agent else 'Chatbot'} Widget",
            "agent_name": c.agent.name if c.agent else "AI Assistant",
            "agent_id": str(c.agent_id),
            "visitor_id": c.visitor_id,
            "status": "Resolved" if c.status == "ACTIVE" else c.status,
            "time": c.created_at.strftime("%b %d, %I:%M %p") if c.created_at else "Recently",
            "lastMessage": last_msg,
            "messages": msgs
        })

    return items


@router.post(
    "/messages/{message_id}/feedback",
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback on an AI response"
)
async def submit_feedback(
    message_id: str,
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Submit user feedback (1-5 rating + optional comment) on an AI message.
    Used for evaluation datasets and model improvement.
    """
    # Verify message exists
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    fb = Feedback(
        message_id=message_id,
        rating=feedback.rating,
        comment=feedback.comment or ""
    )
    db.add(fb)
    await db.commit()

    # Re-run evaluation blending human feedback signal (non-blocking)
    asyncio.create_task(re_evaluate_with_feedback(message_id, feedback.rating))

    return {"status": "ok", "message_id": message_id, "rating": feedback.rating}
