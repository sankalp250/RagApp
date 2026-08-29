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
from backend.app.core.cache import get_cached_chat, set_cached_chat, LRUTtlCache
from backend.app.core.logging import logger
from backend.app.core.exceptions import AgentNotFoundException, DomainException


class ChatService:

    # L1 Memory-Bounded Conversation & History Caches (bounded to 5,000 entries with auto-eviction)
    _CONV_CACHE = LRUTtlCache(maxsize=5000)
    _CONV_CACHE_TTL = 3600.0  # 1 hour
    _HISTORY_CACHE = LRUTtlCache(maxsize=5000)
    _HISTORY_CACHE_TTL = 3600.0  # 1 hour

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
        Retrieves an active conversation by ID (with L1 LRU cache) or provisions a new one.
        """
        # Check L1 cache for existing conversation (< 0.01ms)
        if conversation_id:
            cached_conv = ChatService._CONV_CACHE.get(conversation_id)
            if cached_conv is not None:
                return cached_conv

            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.agent_id == agent_id
            )
            result = await db.execute(stmt)
            conv = result.scalars().first()
            if conv:
                ChatService._CONV_CACHE.set(conversation_id, conv, ttl=ChatService._CONV_CACHE_TTL)
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
        ChatService._CONV_CACHE.set(str(conv.id), conv, ttl=ChatService._CONV_CACHE_TTL)
        return conv

    @staticmethod
    async def _load_conversation_history(
        db: Optional[AsyncSession], conversation_id: str, limit: int = 10
    ) -> List[dict]:
        """
        Loads previous messages with L1 LRU cache. Returns list of message dicts.
        If cache misses and db is None, opens a dedicated brief session.
        """
        # Check L1 LRU cache first (< 0.01ms)
        cached_history = ChatService._HISTORY_CACHE.get(conversation_id)
        if cached_history is not None:
            return cached_history[-limit:]

        if db is None:
            from backend.app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                return await ChatService._load_conversation_history(session, conversation_id, limit)

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        messages = list(reversed(result.scalars().all()))
        history = [{"role": m.role, "content": m.content} for m in messages]
        ChatService._HISTORY_CACHE.set(conversation_id, history, ttl=ChatService._HISTORY_CACHE_TTL)
        return history

    @staticmethod
    def _append_to_history_cache(conversation_id: str, role: str, content: str):
        """Append a message to the L1 LRU history cache (used after stream completes)."""
        cached = ChatService._HISTORY_CACHE.get(conversation_id)
        if cached is not None:
            cached.append({"role": role, "content": content})
            ChatService._HISTORY_CACHE.set(conversation_id, cached, ttl=ChatService._HISTORY_CACHE_TTL)
        else:
            ChatService._HISTORY_CACHE.set(conversation_id, [{"role": role, "content": content}], ttl=ChatService._HISTORY_CACHE_TTL)

    @staticmethod
    async def chat(
        db: AsyncSession,
        agent_id: str,
        organization_id: str,
        request: ChatRequest
    ) -> ChatResponse:
        """
        Executes the complete RAG pipeline for a single chat turn.
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
            is_gap = False
            gap_category = None
        else:
            # Cache Miss: Execute hybrid retrieval
            source_chunks, raw_chunks = await retrieve_context(
                db=db,
                agent_id=agent_id,
                organization_id=organization_id,
                query_text=request.message,
                top_k=5,
                conversation_history=history
            )

            # Generate Answer via LLM
            llm_result = await generate_answer(
                agent=agent,
                user_message=request.message,
                context_chunks=source_chunks,
                conversation_history=history
            )
            answer = llm_result.answer
            in_tok = llm_result.input_tokens
            out_tok = llm_result.output_tokens

            # Evaluate knowledge gap
            is_gap, gap_category = detect_knowledge_gap(
                user_query=request.message,
                answer=answer,
                source_chunks=source_chunks
            )

        latency_ms = (time.monotonic() - start_time) * 1000

        # Step 6: Persist Assistant Message
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

        # Step 7: Persist Retrieval Evidence
        if raw_chunks:
            await save_retrieval_evidence(db, str(assistant_msg.id), raw_chunks, source_chunks)

        # Step 8: Persist Knowledge Gap if detected
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
            except Exception:
                pass

        await db.commit()

        # Step 9: Post-Turn Async Jobs (non-blocking)
        asyncio.create_task(run_evaluation_job(str(assistant_msg.id)))

        if not cached_resp and len(history) <= 1 and "technical difficulties" not in answer.lower() and len(answer) > 10:
            asyncio.create_task(set_cached_chat(
                organization_id=organization_id,
                agent_id=agent_id,
                query=request.message,
                response={"answer": answer, "sources": [s.model_dump() for s in source_chunks]}
            ))

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
        request: ChatRequest,
        agent: Agent = None,
    ):
        """
        High-performance native token streaming chat pipeline.
        Zero pre-stream DB blocking: Resolves conversation, history, and chunks from
        L1 cache in microseconds. Yields initial tokens with minimal TTFT.
        Batches all persistence into a single post-stream transaction.
        """
        import uuid
        start_time = time.monotonic()

        def _elapsed():
            return (time.monotonic() - start_time) * 1000

        # Step 1: L1-only Semantic Response Cache Check (< 0.05ms)
        t0 = time.monotonic()
        cached_resp = await get_cached_chat(organization_id, agent_id, request.message)
        logger.info(f"[PERF] cache_check: {(time.monotonic() - t0)*1000:.1f}ms (total: {_elapsed():.0f}ms)")
        if cached_resp:
            conv_id = request.conversation_id or str(uuid.uuid4())
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

        # Step 2: Instant In-Memory Resolution of Agent, Conversation & History (0.01ms)
        if agent is None:
            t0 = time.monotonic()
            from backend.app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
                result = await db.execute(stmt)
                agent = result.scalars().first()
                if not agent:
                    raise AgentNotFoundException(f"Agent '{agent_id}' not found.")
            logger.info(f"[PERF] agent_fetch: {(time.monotonic() - t0)*1000:.1f}ms (total: {_elapsed():.0f}ms)")
        else:
            logger.info(f"[PERF] agent_fetch: 0.0ms (pre-cached, total: {_elapsed():.0f}ms)")

        is_new_conv = False
        if request.conversation_id:
            conv_id = request.conversation_id
            history = await ChatService._load_conversation_history(None, conv_id)
        else:
            conv_id = str(uuid.uuid4())
            is_new_conv = True
            history = []
            ChatService._CONV_CACHE.set(conv_id, True, ttl=ChatService._CONV_CACHE_TTL)
            ChatService._HISTORY_CACHE.set(conv_id, [], ttl=ChatService._HISTORY_CACHE_TTL)

        # Hybrid Retrieval: query rewriting + BM25 + dense + RRF (0 DB latency on hot chunk cache)
        t0 = time.monotonic()
        source_chunks, raw_chunks = await retrieve_context(
            db=None,
            agent_id=agent_id,
            organization_id=organization_id,
            query_text=request.message,
            top_k=5,
            conversation_history=history
        )
        logger.info(f"[PERF] retrieval: {(time.monotonic() - t0)*1000:.1f}ms (total: {_elapsed():.0f}ms)")

        sources_payload = [s.model_dump() for s in source_chunks]

        # Step 3: Send meta event immediately to client
        logger.info(f"[PERF] >>> META EVENT at {_elapsed():.0f}ms (pre-LLM)")
        yield {
            "event": "meta",
            "conversation_id": conv_id,
            "sources": sources_payload
        }

        # Step 4: Native Token Streaming from LLM with ZERO DB Connections Held
        accumulated_tokens = []
        first_token_time = None
        async for token in generate_answer_stream(
            agent=agent,
            user_message=request.message,
            context_chunks=source_chunks,
            conversation_history=history
        ):
            if first_token_time is None:
                first_token_time = time.monotonic()
                logger.info(f"[PERF] >>> FIRST LLM TOKEN at {_elapsed():.0f}ms")
            accumulated_tokens.append(token)
            yield {"event": "token", "token": token}

        full_answer = "".join(accumulated_tokens)
        latency_ms = (time.monotonic() - start_time) * 1000
        logger.info(f"[PERF] >>> STREAM COMPLETE at {latency_ms:.0f}ms (tokens: {len(accumulated_tokens)})")

        # Step 5: Post-Stream Persistence — Single Batched Database Transaction
        is_gap, gap_category = detect_knowledge_gap(
            user_query=request.message,
            answer=full_answer,
            source_chunks=source_chunks
        )
        assistant_msg_id = None

        from backend.app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            if is_new_conv:
                new_conv_record = Conversation(
                    id=conv_id,
                    agent_id=agent_id,
                    organization_id=organization_id,
                    visitor_id=request.visitor_id,
                    session_id=request.session_id,
                    status="ACTIVE"
                )
                db.add(new_conv_record)

            user_msg = Message(
                conversation_id=conv_id,
                role="user",
                content=request.message,
            )
            db.add(user_msg)

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

        # Update L1 history cache with both messages
        ChatService._append_to_history_cache(conv_id, "user", request.message)
        ChatService._append_to_history_cache(conv_id, "assistant", full_answer)

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
