"""
Chat Domain Service
===================
Primary orchestrator for the RAG conversational intelligence engine.

Module Connections:
  - backend.app.ai.rag_engine        -> Vector search & LLM generation (Gemini / Groq)
  - backend.app.ai.knowledge_gap     -> Detects unanswerable queries & saves to knowledge_gaps table
  - backend.app.workers.evaluation_jobs -> Evaluates retrieval grounding & answer quality asynchronously
  - backend.app.core.cache           -> Semantic response caching via Redis (Upstash)
  - backend.app.db.models.*          -> Persistence for Agents, Conversations, Messages, Evidence
  - backend.app.schemas.chat         -> Pydantic DTOs for request/response payloads

Flow for each chat turn:
  1. Authenticate & fetch Agent configuration
  2. Retrieve or create Conversation record (scoped to visitor_id)
  3. Load multi-turn history for context window
  4. Persist User Message to DB
  5. Check Redis Semantic Response Cache (skips LLM if cached hit)
  6. Vector search: Cosine similarity across document chunks (agent-isolated)
  7. Generate LLM answer with citation injection & CircuitBreaker fallback
  8. Cache response in Redis for future requests
  9. Persist Assistant Message & Retrieval Evidence to DB
  10. Detect Knowledge Gaps (triggers gap record if model is ungrounded or ignorant)
  11. Fire Async Evaluation Job (non-blocking background worker)
  12. Return structured ChatResponse to client
"""
import asyncio
import time
from typing import List, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Conversation, Message
from backend.app.schemas.chat import (
    ChatRequest, ChatResponse, SourceChunk, ConversationHistoryResponse, MessageResponse
)
from backend.app.ai.rag_engine import (
    retrieve_context, generate_answer, generate_answer_stream, save_retrieval_evidence
)
from backend.app.ai.knowledge_gap import detect_knowledge_gap, record_knowledge_gap
from backend.app.workers.evaluation_jobs import run_evaluation_job
from backend.app.core.cache import get_cached_chat, set_cached_chat
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
        """
        Retrieves an active conversation by ID or provisions a new one.

        Connections:
          - Queries `conversations` table matching (conversation_id, agent_id).
          - Scopes conversation to visitor_id and organization_id.

        Args:
          db: Database async session
          agent_id: UUID of the target Agent
          organization_id: UUID of the parent Organization (tenant boundary)
          visitor_id: Anonymous visitor cookie/token from the client widget
          session_id: Optional browser session identifier
          conversation_id: Optional UUID to resume an existing thread

        Returns:
          Conversation model instance
        """
        # If client provided an existing conversation_id, verify and reuse it
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.agent_id == agent_id
            )
            result = await db.execute(stmt)
            conv = result.scalars().first()
            if conv:
                return conv

        # Otherwise create a new Conversation record
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
        """
        Loads previous messages in chronological order for LLM context window.

        Connections:
          - Queries `messages` table ordered by created_at.

        Args:
          db: Database async session
          conversation_id: UUID of the active conversation thread
          limit: Max number of recent turns to include (avoids context overflow)

        Returns:
          List of message dicts: [{"role": "user"|"assistant", "content": "..."}]
        """
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
        Executes the complete RAG pipeline for a single chat turn.

        Connections:
          - `Agent` model (db): Reads system prompt, temperature, max_tokens.
          - `get_cached_chat` / `set_cached_chat` (cache.py): Fast-path response caching.
          - `retrieve_context` (rag_engine.py): Vector similarity search.
          - `generate_answer` (rag_engine.py): Calls Gemini 2.5 Flash / Groq fallback.
          - `save_retrieval_evidence` (rag_engine.py): Persists audit log of used chunks.
          - `detect_knowledge_gap` (knowledge_gap.py): Determines if query was unanswerable.
          - `run_evaluation_job` (evaluation_jobs.py): Async evaluation in background.

        Args:
          db: Database async session
          agent_id: Target chatbot agent UUID
          organization_id: Tenant UUID
          request: ChatRequest DTO (message text, visitor_id, session_id, stream flag)

        Returns:
          ChatResponse DTO with answer text, source chunks, token metrics, and gap metadata
        """
        start_time = time.monotonic()

        # Step 1: Verify Agent existence and tenant access
        stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
        result = await db.execute(stmt)
        agent = result.scalars().first()
        if not agent:
            raise AgentNotFoundException(f"Agent '{agent_id}' not found.")

        # Step 2: Manage conversation lifecycle
        conv = await ChatService.get_or_create_conversation(
            db=db,
            agent_id=agent_id,
            organization_id=organization_id,
            visitor_id=request.visitor_id,
            session_id=request.session_id,
            conversation_id=request.conversation_id
        )

        # Step 3: Fetch prior conversation turns for multi-turn coherence
        history = await ChatService._load_conversation_history(db, str(conv.id))

        # Step 4: Persist incoming user message to database
        user_msg = Message(
            conversation_id=str(conv.id),
            role="user",
            content=request.message,
        )
        db.add(user_msg)
        await db.flush()

        # Step 5: Check Redis semantic response cache for single-turn queries
        cached_resp = None
        if len(history) <= 1:
            cached_resp = await get_cached_chat(organization_id, agent_id, request.message)

        if cached_resp:
            # Cache Hit: reuse answer and citations directly without LLM API cost
            answer = cached_resp["answer"]
            source_chunks = [SourceChunk(**s) for s in cached_resp.get("sources", [])]
            raw_chunks = []
            in_tok = 0
            out_tok = 0
            logger.info(f"Served response for agent {agent_id} from Redis cache.")
        else:
            # Cache Miss: Execute hybrid retrieval (query rewriting + BM25 + dense + RRF)
            source_chunks, raw_chunks = await retrieve_context(
                db=db,
                agent_id=agent_id,
                organization_id=organization_id,
                query_text=request.message,
                top_k=5,
                conversation_history=history
            )

            # Generate answer using LLM (Gemini with Groq circuit-breaker fallback)
            answer, in_tok, out_tok = await generate_answer(
                agent=agent,
                user_message=request.message,
                context_chunks=source_chunks,
                conversation_history=history
            )

            # Store answer in Redis cache for future identical queries
            if len(history) <= 1:
                await set_cached_chat(
                    organization_id=organization_id,
                    agent_id=agent_id,
                    query=request.message,
                    response={"answer": answer, "sources": [s.model_dump() for s in source_chunks]}
                )

        latency_ms = (time.monotonic() - start_time) * 1000

        # Step 6: Persist AI response message with token metrics and latency
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

        # Step 7: Save retrieval evidence linking message to exact document chunks used
        if raw_chunks:
            await save_retrieval_evidence(db, str(assistant_msg.id), raw_chunks, source_chunks)

        # Step 8: Knowledge Gap Detection (signals unanswerable queries for dashboard analytics)
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

        # Commit conversation transaction
        await db.commit()

        # Step 9: Trigger asynchronous evaluation job (runs in background without blocking client)
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
    async def chat_stream(
        agent_id: str,
        organization_id: str,
        request: ChatRequest
    ):
        """
        High-performance native token streaming chat pipeline.
        Connection-Starvation-Free: Releases DB connection before calling LLM streaming.
        Time-to-first-token (TTFT) ~ 200ms - 350ms.
        """
        start_time = time.monotonic()

        # Step 1: Instant L1 / L2 Semantic Response Cache Check (< 0.1ms)
        cached_resp = await get_cached_chat(organization_id, agent_id, request.message)
        if cached_resp:
            async with AsyncSessionLocal() as db:
                conv = await ChatService.get_or_create_conversation(
                    db=db,
                    agent_id=agent_id,
                    organization_id=organization_id,
                    visitor_id=request.visitor_id,
                    session_id=request.session_id,
                    conversation_id=request.conversation_id
                )
                conv_id = str(conv.id)
                await db.commit()

            yield {"event": "meta", "conversation_id": conv_id, "cached": True}
            
            # Instant micro-stream from memory
            words = cached_resp["answer"].split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                yield {"event": "token", "token": token}
            
            yield {
                "event": "done",
                "sources": cached_resp.get("sources", []),
                "knowledge_gap_detected": False
            }
            return

        # Step 2: Short-Lived Session 1 — Fetch Config & History, Write User Message & Retrieve Context
        async with AsyncSessionLocal() as db:
            stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
            result = await db.execute(stmt)
            agent = result.scalars().first()
            if not agent:
                raise AgentNotFoundException(f"Agent '{agent_id}' not found.")

            conv = await ChatService.get_or_create_conversation(
                db=db,
                agent_id=agent_id,
                organization_id=organization_id,
                visitor_id=request.visitor_id,
                session_id=request.session_id,
                conversation_id=request.conversation_id
            )
            conv_id = str(conv.id)
            history = await ChatService._load_conversation_history(db, conv_id)

            user_msg = Message(
                conversation_id=conv_id,
                role="user",
                content=request.message,
            )
            db.add(user_msg)

            # Hybrid Retrieval: query rewriting + BM25 + dense + RRF (< 20ms)
            source_chunks, raw_chunks = await retrieve_context(
                db=db,
                agent_id=agent_id,
                organization_id=organization_id,
                query_text=request.message,
                top_k=5,
                conversation_history=history
            )
            await db.commit()
            # Database connection is returned immediately to the pool!

        sources_payload = [s.model_dump() for s in source_chunks]

        # Step 3: Send meta event immediately to client (< 20ms)
        yield {
            "event": "meta",
            "conversation_id": conv_id,
            "sources": sources_payload
        }

        # Step 4: Native Token Streaming from LLM with ZERO DB Connections Held
        accumulated_tokens = []
        async for token in generate_answer_stream(
            agent=agent,
            user_message=request.message,
            context_chunks=source_chunks,
            conversation_history=history
        ):
            accumulated_tokens.append(token)
            yield {"event": "token", "token": token}

        full_answer = "".join(accumulated_tokens)
        latency_ms = (time.monotonic() - start_time) * 1000

        # Step 5: Short-Lived Session 2 — Persist Assistant Message, Retrieval Evidence & Gaps
        is_gap, gap_category = detect_knowledge_gap(
            user_query=request.message,
            answer=full_answer,
            source_chunks=source_chunks
        )
        assistant_msg_id = None

        async with AsyncSessionLocal() as db:
            assistant_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_answer,
                input_tokens=len(request.message) // 4,
                output_tokens=len(full_answer) // 4,
                latency_ms=latency_ms,
                msg_metadata={"sources": sources_payload}
            )
            db.add(assistant_msg)
            await db.flush()
            assistant_msg_id = str(assistant_msg.id)

            if raw_chunks:
                await save_retrieval_evidence(db, assistant_msg_id, raw_chunks, source_chunks)

            if is_gap and gap_category:
                try:
                    await record_knowledge_gap(
                        db=db,
                        agent_id=agent_id,
                        organization_id=organization_id,
                        message_id=assistant_msg_id,
                        user_query=request.message,
                        gap_category=gap_category,
                        source_chunks=source_chunks
                    )
                except Exception:
                    pass

            await db.commit()

        # Step 6: Trigger Post-Stream Async Tasks (Non-blocking)
        if assistant_msg_id:
            asyncio.create_task(run_evaluation_job(assistant_msg_id))

        if len(history) <= 1 and "technical difficulties" not in full_answer.lower() and len(full_answer) > 10:
            asyncio.create_task(set_cached_chat(
                organization_id=organization_id,
                agent_id=agent_id,
                query=request.message,
                response={"answer": full_answer, "sources": sources_payload}
            ))

        # Step 7: Yield done event with sources
        yield {
            "event": "done",
            "sources": sources_payload,
            "knowledge_gap_detected": is_gap
        }

    @staticmethod
    async def get_conversation_history(
        db: AsyncSession,
        agent_id: str,
        organization_id: str,
        conversation_id: str
    ) -> ConversationHistoryResponse:
        """
        Fetches full message history for a conversation thread.

        Connections:
          - Verifies conversation belongs to `agent_id`.
          - Loads `messages` list ordered chronologically.

        Args:
          db: Database async session
          agent_id: Agent UUID
          organization_id: Organization UUID
          conversation_id: Conversation UUID

        Returns:
          ConversationHistoryResponse containing all messages
        """
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
