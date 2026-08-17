"""
RAG (Retrieval-Augmented Generation) Engine
============================================
Handles:
  1. Embedding the user query
  2. Cosine similarity vector search against document chunks
  3. Context assembly with source attribution
  4. LLM answer generation (Gemini primary / Groq fallback)
"""
import time
import math
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.models.document import DocumentChunk
from backend.app.db.models.agent import Agent
from backend.app.db.models.conversation import Message, RetrievalEvidence
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.schemas.chat import SourceChunk
from backend.app.core.config import settings
from backend.app.core.logging import logger


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def retrieve_context(
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    query_text: str,
    top_k: int = 5,
    similarity_threshold: float = 0.35
) -> Tuple[List[SourceChunk], List[DocumentChunk]]:
    """
    Embed the query and retrieve the top-K most semantically similar chunks.
    Returns (source_chunks_for_response, raw_db_chunk_objects_for_evidence_logging).
    """
    # 1. Embed query
    embedding_provider = EmbeddingService.get_provider()
    query_embeddings = await embedding_provider.embed_texts([query_text])
    if not query_embeddings:
        return [], []
    query_vector = query_embeddings[0]

    # 2. Fetch all READY document chunks for this agent
    stmt = (
        select(DocumentChunk)
        .join(DocumentChunk.document)
        .where(
            DocumentChunk.agent_id == agent_id,
            DocumentChunk.organization_id == organization_id,
        )
        .filter(DocumentChunk.embedding.isnot(None))
    )
    result = await db.execute(stmt)
    all_chunks = result.scalars().all()

    if not all_chunks:
        return [], []

    # 3. Score all chunks by cosine similarity
    scored: List[Tuple[float, DocumentChunk]] = []
    for chunk in all_chunks:
        if chunk.embedding:
            score = _cosine_similarity(query_vector, chunk.embedding)
            if score >= similarity_threshold:
                scored.append((score, chunk))

    # 4. Sort descending and take top-K
    scored.sort(key=lambda x: x[0], reverse=True)
    top_scored = scored[:top_k]

    source_chunks = []
    raw_chunks = []
    for rank, (score, chunk) in enumerate(top_scored):
        source_chunks.append(SourceChunk(
            chunk_id=str(chunk.id),
            content=chunk.content,
            similarity_score=round(score, 4),
            rank=rank + 1,
            document_filename=chunk.chunk_metadata.get("filename")
        ))
        raw_chunks.append(chunk)

    return source_chunks, raw_chunks


async def generate_answer(
    agent: Agent,
    user_message: str,
    context_chunks: List[SourceChunk],
    conversation_history: List[Dict[str, str]]
) -> Tuple[str, int, int]:
    """
    Generate an LLM answer given the retrieved context.
    Returns (answer_text, input_tokens, output_tokens).
    Falls back to Groq if the primary provider fails.
    """
    # Build context string
    if context_chunks:
        context_str = "\n\n---\n\n".join(
            f"[Source {c.rank}] {c.content}" for c in context_chunks
        )
        context_block = f"<context>\n{context_str}\n</context>\n\n"
    else:
        context_block = ""

    system_prompt = agent.system_prompt or (
        "You are a helpful AI assistant. Answer questions based on the provided context. "
        "If the context does not contain enough information, say so honestly."
    )

    full_system = f"{system_prompt}\n\n{context_block}Instructions: Answer the user's question based solely on the context provided above. Cite sources when relevant. If the context is insufficient, acknowledge it."

    config = agent.configuration or {}
    temperature = config.get("temperature", 0.3)
    max_tokens = config.get("max_tokens", 800)

    # Try primary provider (Gemini) with Circuit Breaker
    try:
        from backend.app.core.circuit_breaker import gemini_breaker
        answer, in_tok, out_tok = await gemini_breaker.call(
            _call_gemini,
            system_prompt=full_system,
            history=conversation_history,
            user_message=user_message,
            model=agent.model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return answer, in_tok, out_tok
    except Exception as e:
        logger.warning(f"Primary LLM (Gemini) failed / circuit open: {e}. Falling back to Groq.")

    # Fallback to Groq with Circuit Breaker
    try:
        from backend.app.core.circuit_breaker import groq_breaker
        answer, in_tok, out_tok = await groq_breaker.call(
            _call_groq,
            system_prompt=full_system,
            history=conversation_history,
            user_message=user_message,
            model=settings.GROQ_FALLBACK_MODEL,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return answer, in_tok, out_tok
    except Exception as e:
        logger.error(f"Fallback LLM (Groq) also failed / circuit open: {e}")
        return "I'm experiencing technical difficulties. Please try again later.", 0, 0


async def _call_gemini(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
    model: str = "gemini-2.5-flash",
    temperature: float = 0.3,
    max_tokens: int = 800
) -> Tuple[str, int, int]:
    """Call Gemini via google-generativeai SDK."""
    import google.generativeai as genai  # type: ignore
    genai.configure(api_key=settings.GEMINI_API_KEY)

    gem_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt
    )

    # Build chat history for multi-turn
    chat_history = []
    for msg in history[-10:]:  # last 10 messages for context window management
        role = "user" if msg["role"] == "user" else "model"
        chat_history.append({"role": role, "parts": [msg["content"]]})

    chat = gem_model.start_chat(history=chat_history)
    response = await chat.send_message_async(
        user_message,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens
        )
    )

    answer = response.text or ""
    usage = response.usage_metadata
    in_tok = usage.prompt_token_count if usage else 0
    out_tok = usage.candidates_token_count if usage else 0
    return answer, in_tok, out_tok


async def _call_groq(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
    model: str = "qwen-qwq-32b",
    temperature: float = 0.3,
    max_tokens: int = 800
) -> Tuple[str, int, int]:
    """Call Groq via groq SDK."""
    from groq import AsyncGroq  # type: ignore

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )

    choice = response.choices[0]
    answer = choice.message.content or ""
    usage = response.usage
    in_tok = usage.prompt_tokens if usage else 0
    out_tok = usage.completion_tokens if usage else 0
    return answer, in_tok, out_tok


async def save_retrieval_evidence(
    db: AsyncSession,
    message_id: str,
    raw_chunks: List[DocumentChunk],
    source_chunks: List[SourceChunk]
) -> None:
    """Persist which document chunks were used to answer a message."""
    for src, chunk in zip(source_chunks, raw_chunks):
        evidence = RetrievalEvidence(
            message_id=message_id,
            chunk_id=chunk.id,
            similarity_score=src.similarity_score,
            rank=src.rank,
            context_snippet=chunk.content[:500]
        )
        db.add(evidence)
    await db.commit()
