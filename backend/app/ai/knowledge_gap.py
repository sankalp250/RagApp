"""
Knowledge Gap Detection
=======================
Detects when the agent could NOT answer a query from its knowledge base.
Gaps are stored for knowledge base improvement insights.

A knowledge gap exists when:
  - No relevant chunks were retrieved (empty context)
  - The LLM explicitly says it doesn't know
  - The maximum similarity score is below threshold
"""
import re
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.db.models.knowledge_gap import KnowledgeGap, GapEvidence
from backend.app.schemas.chat import SourceChunk
from backend.app.core.logging import logger

# Phrases that indicate the model admitted it doesn't know
NO_KNOWLEDGE_PHRASES = [
    "i don't have information",
    "i don't know",
    "i'm not sure",
    "i cannot find",
    "i do not have",
    "no relevant information",
    "not mentioned in",
    "not in the context",
    "insufficient information",
    "i don't have enough",
    "i couldn't find",
    "outside my knowledge",
    "i have no information",
    "unable to find",
    "no data available",
]

LOW_CONFIDENCE_THRESHOLD = 0.45  # max similarity score below this → gap


def detect_knowledge_gap(
    user_query: str,
    answer: str,
    source_chunks: List[SourceChunk],
    similarity_threshold: float = LOW_CONFIDENCE_THRESHOLD
) -> Tuple[bool, Optional[str]]:
    """
    Determine if a knowledge gap occurred.
    Returns (is_gap: bool, gap_category: Optional[str]).
    """
    # Case 1: No context retrieved at all
    if not source_chunks:
        return True, "NO_RELEVANT_DOCUMENTS"

    # Case 2: Best similarity score too low
    max_score = max(c.similarity_score for c in source_chunks)
    if max_score < similarity_threshold:
        return True, "LOW_CONFIDENCE_RETRIEVAL"

    # Case 3: LLM answer indicates ignorance
    answer_lower = answer.lower()
    for phrase in NO_KNOWLEDGE_PHRASES:
        if phrase in answer_lower:
            return True, "MODEL_ADMITTED_IGNORANCE"

    return False, None


async def record_knowledge_gap(
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    message_id: str,
    user_query: str,
    gap_category: str,
    source_chunks: List[SourceChunk]
) -> KnowledgeGap:
    """
    Save or increment a knowledge gap record.
    Similar questions are deduplicated by normalizing the query.
    """
    try:
        normalized_query = _normalize_query(user_query)

        # Try to find an existing gap for the same agent + similar query
        stmt = select(KnowledgeGap).where(
            KnowledgeGap.agent_id == agent_id,
            KnowledgeGap.normalized_query == normalized_query,
            KnowledgeGap.status == "OPEN"
        )
        result = await db.execute(stmt)
        existing_gap = result.scalars().first()

        if existing_gap:
            # Increment frequency counter
            existing_gap.frequency = (existing_gap.frequency or 1) + 1
            gap = existing_gap
        else:
            # Create new gap record
            gap = KnowledgeGap(
                agent_id=agent_id,
                organization_id=organization_id,
                query=user_query,
                normalized_query=normalized_query,
                category=gap_category,
                frequency=1,
                status="OPEN",
                top_chunks_context=[
                    {"chunk_id": c.chunk_id, "score": c.similarity_score, "content": c.content[:200]}
                    for c in source_chunks[:3]
                ] if source_chunks else []
            )
            db.add(gap)
            await db.flush()

        # Link gap to the triggering message via GapEvidence
        evidence = GapEvidence(
            gap_id=gap.id,
            message_id=message_id,
            gap_category=gap_category
        )
        db.add(evidence)
        await db.commit()
        await db.refresh(gap)
        return gap

    except Exception as e:
        logger.error(f"Failed to record knowledge gap: {e}", exc_info=e)
        await db.rollback()
        raise


def _normalize_query(query: str) -> str:
    """Lowercase + strip punctuation for deduplication matching."""
    q = query.lower().strip()
    q = re.sub(r"[^\w\s]", "", q)          # remove punctuation
    q = re.sub(r"\s+", " ", q)              # normalize whitespace
    return q[:500]


async def get_knowledge_gap_stats(
    db: AsyncSession,
    organization_id: str,
    agent_id: Optional[str] = None,
    limit: int = 20
) -> List[dict]:
    """Return top knowledge gaps ranked by frequency."""
    stmt = (
        select(
            KnowledgeGap.query,
            KnowledgeGap.category,
            KnowledgeGap.frequency,
            KnowledgeGap.status,
            KnowledgeGap.created_at
        )
        .where(KnowledgeGap.organization_id == organization_id)
        .order_by(KnowledgeGap.frequency.desc(), KnowledgeGap.created_at.desc())
        .limit(limit)
    )
    if agent_id:
        stmt = stmt.where(KnowledgeGap.agent_id == agent_id)

    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "query": r.query,
            "category": r.category,
            "frequency": r.frequency,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in rows
    ]
