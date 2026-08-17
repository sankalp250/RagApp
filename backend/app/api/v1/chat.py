"""
Chat API Router
===============
Endpoints:
  POST /agents/{agent_id}/chat              - Send a message and get answer (sync or SSE stream)
  GET  /agents/{agent_id}/conversations/{id} - Get conversation history
  POST /messages/{message_id}/feedback      - Submit thumbs-up/down feedback
"""
import json
import time
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.api.deps import get_db, get_optional_user
from backend.app.db.models.user import User
from backend.app.db.models.conversation import Message
from backend.app.db.models.evaluation import Feedback
from backend.app.schemas.chat import (
    ChatRequest, ChatResponse, FeedbackCreate, ConversationHistoryResponse
)
from backend.app.domains.chat.service import ChatService
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
            _stream_chat(db, agent_id, organization_id, request),
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
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    request: ChatRequest
) -> AsyncGenerator[str, None]:
    """
    SSE generator — runs the full RAG pipeline then streams the answer token-by-token.
    (True token streaming requires the Gemini streaming API; here we simulate it
    by breaking the full answer into words after retrieval for MVP. Phase 6 upgrades
    this to real streaming with genai.stream_generate_content.)
    """
    try:
        # Run the full RAG pipeline first
        response = await ChatService.chat(
            db=db,
            agent_id=agent_id,
            organization_id=organization_id,
            request=request
        )

        # Stream metadata event first
        meta = {
            "event": "meta",
            "conversation_id": response.conversation_id,
            "message_id": response.message_id,
            "knowledge_gap_detected": response.knowledge_gap_detected,
            "sources": [s.model_dump() for s in response.sources]
        }
        yield f"data: {json.dumps(meta)}\n\n"

        # Stream answer word by word (simulated streaming for MVP)
        words = response.answer.split(" ")
        for i, word in enumerate(words):
            chunk_data = {"event": "token", "token": word + (" " if i < len(words) - 1 else "")}
            yield f"data: {json.dumps(chunk_data)}\n\n"

        # Send done event
        done_data = {
            "event": "done",
            "input_tokens": response.input_tokens,
            "output_tokens": response.output_tokens,
            "latency_ms": response.latency_ms
        }
        yield f"data: {json.dumps(done_data)}\n\n"

    except Exception as e:
        error_data = {"event": "error", "message": str(e)}
        yield f"data: {json.dumps(error_data)}\n\n"


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
    return {"status": "ok", "message_id": message_id, "rating": feedback.rating}
