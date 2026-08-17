"""
Public Widget API
=================
Unauthenticated endpoints for the embeddable chat widget.
Agents are identified by their public_key (safe to expose in client-side JS).

Endpoints:
  GET  /widget/{public_key}/config        - Widget configuration (colors, greeting, etc.)
  POST /widget/{public_key}/chat          - Anonymous chat (no auth required)
  POST /widget/{public_key}/messages/{id}/feedback - Widget feedback
"""
import json
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.api.deps import get_db
from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Message
from backend.app.db.models.evaluation import Feedback
from backend.app.schemas.chat import ChatRequest, ChatResponse, FeedbackCreate
from backend.app.domains.chat.service import ChatService
from backend.app.core.logging import logger

router = APIRouter()


async def _get_agent_by_public_key(public_key: str, db: AsyncSession) -> Agent:
    """Lookup agent by public_key. Raises 404 if not found or INACTIVE."""
    stmt = select(Agent).where(Agent.public_key == public_key, Agent.status == "ACTIVE")
    result = await db.execute(stmt)
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active agent found for key '{public_key}'."
        )
    return agent


@router.get(
    "/{public_key}/config",
    summary="Get widget configuration for a public agent key"
)
async def get_widget_config(
    public_key: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the agent's widget configuration (colors, greeting, title, etc.).
    This endpoint is public and safe to call from any website embedding the widget.
    """
    agent = await _get_agent_by_public_key(public_key, db)
    config = agent.configuration or {}
    return {
        "agent_id": str(agent.id),
        "bot_title": config.get("bot_title", "AI Assistant"),
        "greeting_message": config.get("greeting_message", "Hello! How can I help you today?"),
        "primary_color": config.get("primary_color", "#2563eb"),
        "placeholder_text": config.get("placeholder_text", "Ask a question..."),
        "suggested_questions": config.get("suggested_questions", []),
    }


@router.post(
    "/{public_key}/chat",
    response_model=ChatResponse,
    summary="Anonymous widget chat"
)
async def widget_chat(
    public_key: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    The primary public endpoint consumed by the embeddable JavaScript widget.
    No authentication required — agent is identified by its public_key.
    Supports SSE streaming when `stream: true`.
    """
    agent = await _get_agent_by_public_key(public_key, db)

    if request.stream:
        return StreamingResponse(
            _widget_stream_chat(db, str(agent.id), str(agent.organization_id), request),
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
            agent_id=str(agent.id),
            organization_id=str(agent.organization_id),
            request=request
        )
        return response
    except Exception as e:
        logger.error(f"Widget chat error for public_key={public_key}: {e}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat service temporarily unavailable."
        )


async def _widget_stream_chat(
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    request: ChatRequest
) -> AsyncGenerator[str, None]:
    """SSE generator for widget streaming chat."""
    try:
        response = await ChatService.chat(
            db=db,
            agent_id=agent_id,
            organization_id=organization_id,
            request=request
        )

        # Send meta event
        yield f"data: {json.dumps({'event': 'meta', 'conversation_id': response.conversation_id, 'message_id': response.message_id})}\n\n"

        # Stream answer word by word
        words = response.answer.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'event': 'token', 'token': token})}\n\n"

        yield f"data: {json.dumps({'event': 'done', 'knowledge_gap_detected': response.knowledge_gap_detected})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'message': 'Chat failed. Please try again.'})}\n\n"


@router.post(
    "/{public_key}/messages/{message_id}/feedback",
    status_code=status.HTTP_201_CREATED,
    summary="Widget feedback submission"
)
async def widget_feedback(
    public_key: str,
    message_id: str,
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback from the widget (no auth required)."""
    # Verify the agent public key exists (prevents spam to random message IDs)
    agent = await _get_agent_by_public_key(public_key, db)

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
    return {"status": "ok"}
