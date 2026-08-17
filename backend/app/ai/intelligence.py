"""
Knowledge Gap Intelligence Service
====================================
Uses Gemini/Groq to:
  1. Analyse clusters of unanswered questions
  2. Generate actionable documentation recommendations
  3. Score gap severity (frequency + recency + confidence delta)
  4. Suggest exact document sections/topics to add to knowledge base

Triggered on-demand via the analytics API or scheduled batch.
"""
import json
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.db.models.knowledge_gap import KnowledgeGap
from backend.app.core.config import settings
from backend.app.core.logging import logger


# ─── Gap Scoring Algorithm ───────────────────────────────────────────────────

def compute_gap_score(gap: KnowledgeGap) -> float:
    """
    Composite gap severity score (0.0 – 1.0).
    Factors:
      - frequency: how many times this was unanswerable (weight 0.5)
      - category penalty: NO_RELEVANT_DOCUMENTS is worst (0.3)
      - recency: older gaps slightly lower priority (0.2)
    """
    # Frequency component (normalized, cap at 50 occurrences)
    freq_score = min(gap.frequency / 50.0, 1.0) * 0.5

    # Category severity
    category_scores = {
        "NO_RELEVANT_DOCUMENTS": 1.0,
        "LOW_CONFIDENCE_RETRIEVAL": 0.6,
        "MODEL_ADMITTED_IGNORANCE": 0.4,
    }
    cat_score = category_scores.get(gap.category or "", 0.5) * 0.3

    # Recency: no decay for now (MVP), just base 0.2
    recency_score = 0.2

    return round(freq_score + cat_score + recency_score, 4)


async def score_all_gaps(db: AsyncSession, organization_id: str) -> int:
    """Update gap_score for all OPEN gaps in an org. Returns number updated."""
    stmt = select(KnowledgeGap).where(
        KnowledgeGap.organization_id == organization_id,
        KnowledgeGap.status == "OPEN"
    )
    result = await db.execute(stmt)
    gaps = result.scalars().all()

    for gap in gaps:
        gap.gap_score = compute_gap_score(gap)

    await db.commit()
    return len(gaps)


# ─── AI Recommendation Generator ─────────────────────────────────────────────

async def generate_gap_recommendations(
    gap_queries: List[str],
    agent_context: str = ""
) -> str:
    """
    Use Gemini (or Groq fallback) to generate a concrete recommendation
    for what content to add to the knowledge base to address these gaps.
    """
    if not gap_queries:
        return "No gaps to analyse."

    # Format the top gap queries
    formatted = "\n".join(f"- {q}" for q in gap_queries[:10])

    prompt = f"""You are a knowledge management expert helping a company improve their AI support chatbot's knowledge base.

The following customer questions could NOT be answered by the AI agent:
{formatted}

{f'Agent context: {agent_context}' if agent_context else ''}

Based on these unanswered questions, provide:
1. **Root Cause**: What type of content is missing?
2. **Recommended Documents**: List 3-5 specific document topics or sections to add
3. **Priority**: Which is most critical to address first and why?
4. **Sample Content**: Write a brief example of what the first document should cover (2-3 sentences)

Be specific and actionable. Format your response clearly."""

    # Try Gemini first
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = await model.generate_content_async(prompt)
        return response.text or "No recommendation generated."
    except Exception as e:
        logger.warning(f"Gemini recommendation failed: {e}. Falling back to Groq.")

    # Fallback to Groq
    try:
        from groq import AsyncGroq  # type: ignore
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        response = await client.chat.completions.create(
            model=settings.GROQ_FALLBACK_MODEL,
            messages=[
                {"role": "system", "content": "You are a knowledge management expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.4
        )
        return response.choices[0].message.content or "No recommendation generated."
    except Exception as e:
        logger.error(f"Groq recommendation also failed: {e}")
        return "Unable to generate recommendation at this time."


async def enrich_gap_with_recommendation(
    db: AsyncSession,
    gap_id: str,
    organization_id: str
) -> Optional[str]:
    """
    Fetch the gap, generate an AI recommendation, and save it.
    Returns the recommendation text.
    """
    stmt = select(KnowledgeGap).where(
        KnowledgeGap.id == gap_id,
        KnowledgeGap.organization_id == organization_id
    )
    result = await db.execute(stmt)
    gap = result.scalars().first()

    if not gap:
        return None

    # Fetch related gaps with same category for cluster analysis
    related_stmt = select(KnowledgeGap.query).where(
        KnowledgeGap.agent_id == gap.agent_id,
        KnowledgeGap.category == gap.category,
        KnowledgeGap.status == "OPEN"
    ).order_by(desc(KnowledgeGap.frequency)).limit(10)

    related_result = await db.execute(related_stmt)
    related_queries = [row[0] for row in related_result.all()]

    recommendation = await generate_gap_recommendations(
        gap_queries=related_queries or [gap.query]
    )

    gap.recommended_action = recommendation
    gap.gap_score = compute_gap_score(gap)
    await db.commit()

    return recommendation


# ─── Batch Intelligence Report ────────────────────────────────────────────────

async def get_knowledge_health_report(
    db: AsyncSession,
    organization_id: str,
    agent_id: Optional[str] = None
) -> Dict:
    """
    Generate a knowledge health report for a given org/agent.
    Returns aggregate stats + top gaps + overall health score.
    """
    base_filter = [KnowledgeGap.organization_id == organization_id]
    if agent_id:
        base_filter.append(KnowledgeGap.agent_id == agent_id)

    # Total gaps
    total = await db.scalar(
        select(func.count(KnowledgeGap.id)).where(*base_filter)
    )
    open_gaps = await db.scalar(
        select(func.count(KnowledgeGap.id)).where(
            *base_filter, KnowledgeGap.status == "OPEN"
        )
    )
    resolved_gaps = await db.scalar(
        select(func.count(KnowledgeGap.id)).where(
            *base_filter, KnowledgeGap.status == "RESOLVED"
        )
    )

    # Category breakdown
    cat_stmt = select(
        KnowledgeGap.category,
        func.count(KnowledgeGap.id).label("count"),
        func.sum(KnowledgeGap.frequency).label("total_occurrences")
    ).where(*base_filter).group_by(KnowledgeGap.category)
    cat_result = await db.execute(cat_stmt)
    categories = [
        {"category": r.category, "gap_count": r.count, "total_occurrences": r.total_occurrences}
        for r in cat_result.all()
    ]

    # Top 5 gaps by frequency
    top_stmt = (
        select(KnowledgeGap)
        .where(*base_filter, KnowledgeGap.status == "OPEN")
        .order_by(desc(KnowledgeGap.frequency))
        .limit(5)
    )
    top_result = await db.execute(top_stmt)
    top_gaps = [
        {"query": g.query, "frequency": g.frequency, "category": g.category, "gap_score": g.gap_score}
        for g in top_result.scalars().all()
    ]

    # Health score: 100% = no gaps, 0% = many unresolved high-freq gaps
    if total == 0:
        health_score = 100
    else:
        resolution_rate = (resolved_gaps or 0) / total
        health_score = max(0, round(50 + (resolution_rate * 50) - (min(open_gaps or 0, 50)), 1))

    return {
        "health_score": health_score,
        "total_gaps": total or 0,
        "open_gaps": open_gaps or 0,
        "resolved_gaps": resolved_gaps or 0,
        "category_breakdown": categories,
        "top_gaps": top_gaps
    }
