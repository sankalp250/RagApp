"""
Chat Domain Service
===================
Orchestrates the full RAG conversation flow:
  1. Conversation management (create / resume)
  2. Context retrieval from vector store
  3. LLM answer generation
  4. Message persistence
  5. Knowledge gap detection & recording
  6. Response assembly
"""
import asyncio
import time
from typing import List, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Conversation, Message
from backend.app.schemas.chat import (
    ChatRequest, ChatResponse, SourceChunk, ConversationHistoryResponse, MessageResponse
)
from backend.app.ai.rag_engine import (
    retrieve_context, generate_answer, save_retrieval_evidence
)
from backend.app.ai.knowledge_gap import detect_knowledge_gap, record_knowledge_gap
from backend.app.workers.evaluation_jobs import run_evaluation_job
from backend.app.core.logging import logger
from backend.app.core.exceptions import AgentNotFoundException, DomainException


class ChatService:

    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession,
        agent_id: str,
        organization_id: str,
        visitor_id: str,
        session_id: Optional[str],
        conversation_id: Optional[str]
    ) -> Conversation:
        """Retrieve an existing conversation or create a new one."""
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.agent_id == agent_id
            )
            result = await db.execute(stmt)
            conv = result.scalars().first()
            if conv:
                return conv

        # Create new conversation
        conv = Conversation(
            agent_id=agent_id,
            organization_id=organization_id,
            visitor_id=visitor_id,
            session_id=session_id,
            status="ACTIVE"
        )
        db.add(conv)
        await db.flush()
        return conv

    @staticmethod
    async def _load_conversation_history(
        db: AsyncSession, conversation_id: str, limit: int = 10
    ) -> List[dict]:
        """Return last N messages as simple dicts for LLM history."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        messages = list(reversed(result.scalars().all()))
        return [{"role": m.role, "content": m.content} for m in messages]

    @staticmethod
    async def chat(
        db: AsyncSession,
        agent_id: str,
        organization_id: str,
        request: ChatRequest
    ) -> ChatResponse:
        """
        Full RAG pipeline for a single chat turn.
        """
        start_time = time.monotonic()

        # 1. Load agent
        stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
        result = await db.execute(stmt)
        agent = result.scalars().first()
        if not agent:
            raise AgentNotFoundException(f"Agent '{agent_id}' not found.")

        # 2. Conversation management
        conv = await ChatService.get_or_create_conversation(
            db=db,
            agent_id=agent_id,
            organization_id=organization_id,
            visitor_id=request.visitor_id,
            session_id=request.session_id,
            conversation_id=request.conversation_id
        )

        # 3. Load conversation history for multi-turn
        history = await ChatService._load_conversation_history(db, str(conv.id))

        # 4. Save user message
        user_msg = Message(
            conversation_id=str(conv.id),
            role="user",
            content=request.message,
        )
        db.add(user_msg)
        await db.flush()

        # 5. Check semantic response cache for single-turn queries
        from backend.app.core.cache import get_cached_chat, set_cached_chat
        cached_resp = None
        if len(history) <= 1:
            cached_resp = await get_cached_chat(organization_id, agent_id, request.message)

        if cached_resp:
            answer = cached_resp["answer"]
            source_chunks = [SourceChunk(**s) for s in cached_resp.get("sources", [])]
            raw_chunks = []
            in_tok = 0
            out_tok = 0
        else:
            # Retrieve context via vector similarity search
            source_chunks, raw_chunks = await retrieve_context(
                db=db,
                agent_id=agent_id,
                organization_id=organization_id,
                query_text=request.message,
                top_k=5
            )

            # Generate LLM answer
            answer, in_tok, out_tok = await generate_answer(
                agent=agent,
                user_message=request.message,
                context_chunks=source_chunks,
                conversation_history=history
            )

            # Cache the response for future requests
            if len(history) <= 1:
                await set_cached_chat(
                    organization_id=organization_id,
                    agent_id=agent_id,
                    query=request.message,
                    response={"answer": answer, "sources": [s.model_dump() for s in source_chunks]}
                )

        latency_ms = (time.monotonic() - start_time) * 1000

        # 7. Save assistant message
        assistant_msg = Message(
            conversation_id=str(conv.id),
            role="assistant",
            content=answer,
            input_tokens=in_tok,
            output_tokens=out_tok,
            latency_ms=latency_ms,
            msg_metadata={"sources": [s.model_dump() for s in source_chunks]}
        )
        db.add(assistant_msg)
        await db.flush()

        # 8. Save retrieval evidence (audit trail)
        if raw_chunks:
            await save_retrieval_evidence(db, str(assistant_msg.id), raw_chunks, source_chunks)

        # 9. Knowledge gap detection
        is_gap, gap_category = detect_knowledge_gap(
            user_query=request.message,
            answer=answer,
            source_chunks=source_chunks
        )
        if is_gap and gap_category:
            try:
                await record_knowledge_gap(
                    db=db,
                    agent_id=agent_id,
                    organization_id=organization_id,
                    message_id=str(assistant_msg.id),
                    user_query=request.message,
                    gap_category=gap_category,
                    source_chunks=source_chunks
                )
            except Exception as e:
                logger.warning(f"Knowledge gap recording failed (non-fatal): {e}")

        await db.commit()

        # 10. Fire async evaluation job (non-blocking — does not affect response latency)
        msg_id_for_eval = str(assistant_msg.id)
        asyncio.create_task(run_evaluation_job(msg_id_for_eval))

        return ChatResponse(
            conversation_id=str(conv.id),
            message_id=str(assistant_msg.id),
            answer=answer,
            sources=source_chunks,
            input_tokens=in_tok,
            output_tokens=out_tok,
            latency_ms=round(latency_ms, 2),
            knowledge_gap_detected=is_gap,
            gap_category=gap_category
        )

    @staticmethod
    async def get_conversation_history(
        db: AsyncSession,
        agent_id: str,
        organization_id: str,
        conversation_id: str
    ) -> ConversationHistoryResponse:
        """Fetch all messages for a conversation."""
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.agent_id == agent_id
        )
        result = await db.execute(stmt)
        conv = result.scalars().first()
        if not conv:
            raise DomainException(
                message=f"Conversation '{conversation_id}' not found.",
                status_code=404
            )

        msg_stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        messages = msg_result.scalars().all()

        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=[MessageResponse.model_validate(m) for m in messages]
        )
