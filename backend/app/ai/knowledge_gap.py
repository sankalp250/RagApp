"""
Knowledge Gap Detection & Semantic Clustering Engine
=====================================================
Detects when the agent fails to answer queries sufficiently and clusters
semantically similar failure questions into cohesive, actionable topics.

Key Capabilities:
  - Multi-Signal Failure Evaluation (retrieval, grounding, ignorance, feedback)
  - Semantic Vector Clustering (groups similar phrasing into one Topic)
  - Failure Aggregation (occurrence count, question variations, confidence)
  - Actionable Dashboard Suggestions (recommends specific knowledge additions)
"""
import math
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from backend.app.db.models.knowledge_gap import KnowledgeGap, GapEvidence
from backend.app.schemas.chat import SourceChunk
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.core.logging import logger

# Similarity threshold for clustering candidate queries under an existing KnowledgeGap
SEMANTIC_CLUSTERING_THRESHOLD = 0.72

# Stopwords for topic synthesis
_STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "can", "could", "would", "should", "how", "what", "where", "when", "why", "who",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "i", "you", "my", "your", "our", "we", "me", "it", "this", "that",
    "please", "tell", "explain", "about", "there", "any", "some"
}


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return max(-1.0, min(1.0, dot / (norm1 * norm2)))


def synthesize_topic_title(query: str) -> str:
    """
    Synthesizes a clean, human-readable Topic title from a user question.
    Example: 'Can I change my delivery address?' -> 'Delivery Address Changes'
    """
    clean = query.strip()
    lower = clean.lower()

    # Rule-based clean taxonomy mappings for high-frequency common customer topics
    if any(w in lower for w in ["address", "delivery location", "shipping address", "redirect", "destination"]):
        return "Delivery Address & Shipping Changes"
    if any(w in lower for w in ["return", "refund", "exchange", "money back", "rma"]):
        return "Returns, Refunds & Exchanges"
    if any(w in lower for w in ["shipping cost", "delivery fee", "express delivery", "international shipping"]):
        return "Shipping Rates & International Delivery"
    if any(w in lower for w in ["cancel", "cancellation", "abort order"]):
        return "Order Cancellation & Modifications"
    if any(w in lower for w in ["invoice", "receipt", "billing", "tax", "payment method", "credit card"]):
        return "Billing, Invoicing & Payment Methods"
    if any(w in lower for w in ["discount", "coupon", "promo code", "voucher"]):
        return "Promotions, Coupons & Discounts"
    if any(w in lower for w in ["sso", "saml", "login", "password reset", "2fa", "mfa"]):
        return "Account Access & SSO Authentication"
    if any(w in lower for w in ["api", "webhook", "rate limit", "token", "sdk"]):
        return "Developer API & Webhook Specifications"
    if any(w in lower for w in ["hours", "contact", "phone", "email", "support agent", "human"]):
        return "Contact Details & Support Hours"

    # Generic linguistic topic extraction: extract content keywords
    words = re.findall(r'\b[a-zA-Z]{3,}\b', clean)
    keywords = [w.capitalize() for w in words if w.lower() not in _STOPWORDS]
    if len(keywords) >= 2:
        return " ".join(keywords[:4]) + " Inquiries"
    elif len(keywords) == 1:
        return f"{keywords[0]} Inquiries"
    
    # Fallback to trimmed query
    return clean[:50]


def _normalize_query(query: str) -> str:
    """Lowercase + strip punctuation for deduplication matching."""
    q = query.lower().strip()
    q = re.sub(r"[^\w\s]", "", q)
    q = re.sub(r"\s+", " ", q)
    return q[:500]


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
    "i can only assist with questions regarding",
    "only assist with questions",
    "outside the scope",
]


def detect_knowledge_gap(
    user_query: str,
    answer: str,
    source_chunks: List[SourceChunk],
    similarity_threshold: float = 0.45
) -> Tuple[bool, Optional[str]]:
    """Determine if a knowledge gap occurred (backward compatible)."""
    if not source_chunks:
        return True, "NO_RELEVANT_DOCUMENTS"

    max_score = max((c.similarity_score for c in source_chunks), default=0.0)
    effective_thresh = 0.012 if max_score <= 0.05 else similarity_threshold
    if max_score < effective_thresh:
        return True, "LOW_CONFIDENCE_RETRIEVAL"

    answer_lower = answer.lower() if answer else ""
    for phrase in NO_KNOWLEDGE_PHRASES:
        if phrase in answer_lower:
            return True, "MODEL_ADMITTED_IGNORANCE"

    return False, None


async def record_knowledge_gap_with_clustering(
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    message_id: str,
    user_query: str,
    gap_category: str,
    source_chunks: List[SourceChunk],
    retrieval_score: float = 0.0,
    grounding_score: float = 0.0,
    answer_quality_score: float = 0.0,
    user_feedback_rating: Optional[int] = None,
    feedback_comment: Optional[str] = None
) -> KnowledgeGap:
    """
    Primary Knowledge Gap Clustering entry point.
    Asynchronously aggregates failure queries into semantic topics via vector similarity.
    """
    try:
        normalized_q = _normalize_query(user_query)
        now = datetime.now(timezone.utc)

        # 1. Generate Query Vector Embedding for Semantic Clustering
        provider = EmbeddingService.get_provider()
        query_vec = await provider.embed_query(user_query)

        # 2. Fetch existing OPEN knowledge gaps for this Agent & Org
        stmt = (
            select(KnowledgeGap)
            .where(
                KnowledgeGap.agent_id == agent_id,
                KnowledgeGap.organization_id == organization_id,
                KnowledgeGap.status == "OPEN"
            )
            .order_by(desc(KnowledgeGap.last_seen_at))
            .limit(100)
        )
        result = await db.execute(stmt)
        existing_gaps = result.scalars().all()

        best_gap: Optional[KnowledgeGap] = None
        best_sim = -1.0

        candidate_topic = synthesize_topic_title(user_query)

        for g in existing_gaps:
            # Check 1: Direct normalized query match
            if g.normalized_query == normalized_q:
                best_gap = g
                best_sim = 1.0
                break

            # Check 2: Equivalent synthesized topic taxonomy match
            if g.topic and candidate_topic and g.topic == candidate_topic:
                best_gap = g
                best_sim = 1.0
                break

            # Check 3: Semantic vector cosine similarity
            if g.embedding:
                sim = _cosine_similarity(query_vec, g.embedding)
                if sim > best_sim and sim >= 0.65:
                    best_sim = sim
                    best_gap = g

        # 3. Aggregate into Existing Gap or Create New Topic
        if best_gap:
            # Increment frequency & update timestamps
            best_gap.frequency += 1
            best_gap.last_seen_at = now

            # Append unique question variation
            samples = list(best_gap.sample_questions or [])
            if user_query not in samples and len(samples) < 10:
                samples.append(user_query)
            best_gap.sample_questions = samples

            # Update vector centroid: running average
            if best_gap.embedding and len(best_gap.embedding) == len(query_vec):
                n = best_gap.frequency
                updated_vec = [
                    ((best_gap.embedding[i] * (n - 1)) + query_vec[i]) / n
                    for i in range(len(query_vec))
                ]
                # Re-normalize
                norm = math.sqrt(sum(x * x for x in updated_vec))
                if norm > 0:
                    updated_vec = [x / norm for x in updated_vec]
                best_gap.embedding = updated_vec

            # Update rolling retrieval metrics
            curr_metrics = dict(best_gap.retrieval_metrics or {})
            n_obs = best_gap.frequency
            curr_metrics["avg_retrieval_score"] = round(
                ((curr_metrics.get("avg_retrieval_score", 0.0) * (n_obs - 1)) + retrieval_score) / n_obs,
                4
            )
            curr_metrics["avg_grounding_score"] = round(
                ((curr_metrics.get("avg_grounding_score", 0.0) * (n_obs - 1)) + grounding_score) / n_obs,
                4
            )
            curr_metrics["avg_quality_score"] = round(
                ((curr_metrics.get("avg_quality_score", 0.0) * (n_obs - 1)) + answer_quality_score) / n_obs,
                4
            )
            best_gap.retrieval_metrics = curr_metrics

            # Update feedback signals
            curr_feedback = dict(best_gap.feedback_metrics or {})
            if user_feedback_rating is not None and user_feedback_rating <= 2:
                curr_feedback["thumbs_down_count"] = curr_feedback.get("thumbs_down_count", 0) + 1
            if feedback_comment:
                comments = curr_feedback.get("comments", [])
                if feedback_comment not in comments and len(comments) < 5:
                    comments.append(feedback_comment)
                curr_feedback["comments"] = comments
            best_gap.feedback_metrics = curr_feedback

            # Recompute composite confidence / urgency score (0.0 to 1.0)
            freq_weight = min(best_gap.frequency * 0.12, 0.45)
            feedback_weight = min(curr_feedback.get("thumbs_down_count", 0) * 0.15, 0.30)
            best_gap.confidence = round(min(0.40 + freq_weight + feedback_weight, 1.0), 2)

            gap = best_gap
            logger.info(
                f"[KnowledgeGap] Aggregated query '{user_query}' into topic '{gap.topic}' "
                f"(frequency={gap.frequency}, confidence={gap.confidence:.2f}, sim={best_sim:.2f})"
            )
        else:
            # Create new KnowledgeGap topic candidate
            topic_title = synthesize_topic_title(user_query)
            top_chunks = [
                {"chunk_id": c.chunk_id, "score": c.similarity_score, "content": c.content[:200]}
                for c in source_chunks[:3]
            ] if source_chunks else []

            gap = KnowledgeGap(
                agent_id=agent_id,
                organization_id=organization_id,
                topic=topic_title,
                query=user_query,
                normalized_query=normalized_q,
                sample_questions=[user_query],
                category=gap_category,
                frequency=1,
                confidence=0.45,
                status="OPEN",
                embedding=query_vec,
                retrieval_metrics={
                    "avg_retrieval_score": round(retrieval_score, 4),
                    "avg_grounding_score": round(grounding_score, 4),
                    "avg_quality_score": round(answer_quality_score, 4),
                },
                feedback_metrics={
                    "thumbs_down_count": 1 if (user_feedback_rating is not None and user_feedback_rating <= 2) else 0,
                    "comments": [feedback_comment] if feedback_comment else []
                },
                first_seen_at=now,
                last_seen_at=now,
                top_chunks_context=top_chunks,
                recommended_action=f"Create or import a knowledge source covering: {topic_title}"
            )
            db.add(gap)
            await db.flush()
            logger.info(f"[KnowledgeGap] Created new gap topic '{topic_title}' for query: '{user_query}'")

        # 4. Link GapEvidence
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
        logger.error(f"[KnowledgeGap] Failed to record knowledge gap: {e}", exc_info=e)
        await db.rollback()
        raise


async def record_knowledge_gap(
    db: AsyncSession,
    agent_id: str,
    organization_id: str,
    message_id: str,
    user_query: str,
    gap_category: str,
    source_chunks: List[SourceChunk]
) -> KnowledgeGap:
    """Backward-compatible wrapper routing to semantic clustering."""
    return await record_knowledge_gap_with_clustering(
        db=db,
        agent_id=agent_id,
        organization_id=organization_id,
        message_id=message_id,
        user_query=user_query,
        gap_category=gap_category,
        source_chunks=source_chunks
    )


async def get_knowledge_gap_stats(
    db: AsyncSession,
    organization_id: str,
    agent_id: Optional[str] = None,
    limit: int = 20
) -> List[dict]:
    """Return top knowledge gaps ranked by occurrence frequency and confidence."""
    stmt = (
        select(KnowledgeGap)
        .where(KnowledgeGap.organization_id == organization_id)
        .order_by(desc(KnowledgeGap.frequency), desc(KnowledgeGap.confidence), desc(KnowledgeGap.last_seen_at))
        .limit(limit)
    )
    if agent_id:
        stmt = stmt.where(KnowledgeGap.agent_id == agent_id)

    result = await db.execute(stmt)
    gaps = result.scalars().all()

    return [
        {
            "id": str(g.id),
            "agent_id": str(g.agent_id),
            "topic": g.topic or synthesize_topic_title(g.query),
            "query": g.query,
            "sample_questions": g.sample_questions or [g.query],
            "occurrence_count": g.frequency,
            "confidence": round(g.confidence, 2),
            "category": g.category,
            "status": g.status,
            "retrieval_metrics": g.retrieval_metrics or {},
            "feedback_metrics": g.feedback_metrics or {},
            "first_seen": g.first_seen_at.isoformat() if g.first_seen_at else None,
            "last_seen": g.last_seen_at.isoformat() if g.last_seen_at else None,
            "recommended_action": g.recommended_action or f"Add documentation covering {g.topic or g.query}"
        }
        for g in gaps
    ]

