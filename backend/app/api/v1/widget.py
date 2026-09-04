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
import asyncio
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.app.api.deps import get_db
from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Message
from backend.app.db.models.evaluation import Feedback
from backend.app.schemas.chat import ChatRequest, ChatResponse, FeedbackCreate
from backend.app.domains.chat.service import ChatService
from backend.app.core.cache import LRUTtlCache
from backend.app.core.logging import logger

router = APIRouter()


# L1 Agent Cache — memory-bounded LRU cache (< 0.01ms lookup, auto-evicting)
_AGENT_L1_CACHE = LRUTtlCache(maxsize=1000)
_AGENT_L1_TTL = 3600.0  # 1 hour (invalidated explicitly on updates)

async def _get_agent_by_public_key(public_key: str, db: AsyncSession) -> Agent:
    """Lookup agent by public_key or agent_id with L1 memory caching. Raises 404 if not found or INACTIVE."""
    # Check L1 cache first (< 0.01ms)
    agent = _AGENT_L1_CACHE.get(public_key)
    if agent is not None:
        return agent

    stmt = select(Agent).where(
        or_(Agent.public_key == public_key, Agent.id == public_key),
        Agent.status == "ACTIVE"
    )
    result = await db.execute(stmt)
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active agent found for key or ID '{public_key}'."
        )
    # Cache in L1 memory
    _AGENT_L1_CACHE.set(public_key, agent, ttl=_AGENT_L1_TTL)
    return agent


from backend.app.schemas.crawler import WidgetBootstrapRequest, WidgetBootstrapResponse
from backend.app.domains.crawler.service import CrawlerService


@router.post(
    "/bootstrap",
    response_model=WidgetBootstrapResponse,
    summary="Initialize widget and automatically trigger initial website crawl if needed"
)
async def bootstrap_widget(
    request: WidgetBootstrapRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Called by embed widget on load.
    Validates origin against agent's authorized domains, idempotently initiates
    the initial website crawl, and returns widget configuration and knowledge status.
    """
    return await CrawlerService.bootstrap_widget(db, request)


@router.post(
    "/{public_key}/bootstrap",
    response_model=WidgetBootstrapResponse,
    summary="Initialize widget by public key and automatically trigger initial website crawl"
)
async def bootstrap_widget_by_key(
    public_key: str,
    request: WidgetBootstrapRequest,
    db: AsyncSession = Depends(get_db)
):
    """Path-based bootstrap endpoint identifying agent by public_key in URL."""
    request.public_key = public_key
    return await CrawlerService.bootstrap_widget(db, request)


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
    Proactively warms the agent's document chunk index in RAM and GenAI connection
    in the background while the visitor is viewing the page.
    """
    import asyncio
    from backend.app.core.cache import get_cached_widget_config, set_cached_widget_config
    from backend.app.ai.rag_engine import _get_or_build_index
    from backend.app.ai.embeddings.service import EmbeddingService
    
    agent = await _get_agent_by_public_key(public_key, db)
    
    # Proactive Background Pre-warming: load chunk index and warm GenAI connection
    # By the time the user finishes typing a question, all memory structures are hot!
    async def _proactive_warmup():
        try:
            await _get_or_build_index(None, str(agent.id), str(agent.organization_id))
            provider = EmbeddingService.get_provider()
            await provider.embed_query("warmup ping")
        except Exception:
            pass
    asyncio.create_task(_proactive_warmup())

    cached = await get_cached_widget_config(public_key)
    if cached:
        return cached

    config = agent.configuration or {}
    result = {
        "agent_id": str(agent.id),
        "bot_title": config.get("bot_title", "AI Assistant"),
        "greeting_message": config.get("greeting_message", "Hello! How can I help you today?"),
        "primary_color": config.get("primary_color", "#2563eb"),
        "placeholder_text": config.get("placeholder_text", "Ask a question..."),
        "suggested_questions": config.get("suggested_questions", []),
    }
    await set_cached_widget_config(public_key, result)
    return result


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
            _widget_stream_chat(str(agent.id), str(agent.organization_id), request, agent=agent),
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
    agent_id: str,
    organization_id: str,
    request: ChatRequest,
    agent: Agent = None,
) -> AsyncGenerator[str, None]:
    """SSE generator for widget streaming chat — passes pre-fetched agent to avoid redundant DB lookup."""
    try:
        async for sse_event in ChatService.chat_stream(
            agent_id=agent_id,
            organization_id=organization_id,
            request=request,
            agent=agent,
        ):
            yield f"data: {json.dumps(sse_event)}\n\n"

    except Exception as e:
        logger.error(f"Widget stream chat error: {e}", exc_info=e)
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
