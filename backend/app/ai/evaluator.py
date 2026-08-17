"""
Async Evaluation Engine
========================
Runs after every assistant message to score response quality across 3 signals:

  1. Retrieval Score  — How relevant were the retrieved chunks?
  2. Grounding Score  — Is the answer grounded in the context or hallucinated?
  3. Answer Quality   — Is the answer complete, coherent, and helpful?

Each signal is scored 0.0 – 1.0.
A composite quality score is stored on the Evaluation record.
"""
import re
from typing import List, Optional, Tuple
from backend.app.schemas.chat import SourceChunk
from backend.app.core.logging import logger


# ─── Signal 1: Retrieval Score ──────────────────────────────────────────────

def compute_retrieval_score(source_chunks: List[SourceChunk]) -> float:
    """
    Score based on the quality of retrieved context.
    - 0 chunks → 0.0
    - Best similarity score weighted with number of useful chunks.
    """
    if not source_chunks:
        return 0.0

    scores = [c.similarity_score for c in source_chunks]
    max_score = max(scores)
    avg_score = sum(scores) / len(scores)

    # Weight: 70% max, 30% avg (to reward consistency, not just one good chunk)
    retrieval_score = (0.7 * max_score) + (0.3 * avg_score)
    return round(min(retrieval_score, 1.0), 4)


# ─── Signal 2: Grounding Score ───────────────────────────────────────────────

# Keywords the model uses when it admits it doesn't know
_UNGROUNDED_PHRASES = [
    "i don't have information",
    "i do not have",
    "i'm not sure",
    "i cannot find",
    "not in the context",
    "not mentioned",
    "i don't know",
    "no relevant information",
    "unable to find",
    "outside my knowledge",
    "i have no information",
]

# Strong grounding signals — model cites sources or refers to context
_GROUNDED_PHRASES = [
    "according to",
    "based on",
    "the document",
    "as mentioned",
    "the context",
    "as stated",
    "per the",
    "source",
    "reference",
]


def compute_grounding_score(
    answer: str,
    source_chunks: List[SourceChunk]
) -> float:
    """
    Heuristic grounding score — checks if the answer:
    - Uses language that implies context reference (positive signal)
    - Contains admission-of-ignorance phrases (negative signal)
    - Has lexical overlap with retrieved context (positive signal)
    """
    if not answer:
        return 0.0

    answer_lower = answer.lower()

    # Negative: admission of ignorance
    for phrase in _UNGROUNDED_PHRASES:
        if phrase in answer_lower:
            return 0.1  # Not grounded at all

    if not source_chunks:
        return 0.2  # No context, can't be grounded

    # Positive: explicit grounding language
    grounding_signals = sum(1 for p in _GROUNDED_PHRASES if p in answer_lower)
    citation_bonus = min(grounding_signals * 0.1, 0.3)

    # Lexical overlap: what % of answer words appear in context
    context_text = " ".join(c.content.lower() for c in source_chunks)
    context_words = set(re.findall(r'\b\w{4,}\b', context_text))  # words ≥ 4 chars
    answer_words = set(re.findall(r'\b\w{4,}\b', answer_lower))

    if not answer_words:
        return 0.3

    overlap = len(answer_words & context_words) / len(answer_words)
    overlap_score = min(overlap * 1.5, 0.7)  # cap at 0.7

    grounding_score = overlap_score + citation_bonus
    return round(min(grounding_score, 1.0), 4)


# ─── Signal 3: Answer Quality ────────────────────────────────────────────────

_SHORT_ANSWER_THRESHOLD = 30   # chars — very short = poor quality
_GOOD_ANSWER_THRESHOLD = 150   # chars — substantive answer

_FAILURE_PATTERNS = [
    r"i (can't|cannot|couldn't|don't|do not) (help|assist|answer|respond)",
    r"please (contact|reach out|speak|talk) (to|with) (a human|support|us)",
    r"i am (just|only) an ai",
    r"error|exception|failed|unavailable",
]


def compute_answer_quality(answer: str) -> float:
    """
    Heuristic quality score:
    - Penalizes very short answers
    - Penalizes failure/deflection patterns
    - Rewards structured, substantive answers
    """
    if not answer or len(answer.strip()) < 10:
        return 0.0

    answer_lower = answer.lower().strip()
    length = len(answer_lower)

    # Failure pattern detection
    for pattern in _FAILURE_PATTERNS:
        if re.search(pattern, answer_lower):
            return 0.2

    # Length-based scoring
    if length < _SHORT_ANSWER_THRESHOLD:
        length_score = 0.3
    elif length < _GOOD_ANSWER_THRESHOLD:
        length_score = 0.6
    else:
        length_score = 0.85

    # Bonus for structured content (lists, numbers, etc.)
    structure_bonus = 0.0
    if any(marker in answer for marker in ['\n-', '\n•', '\n*', '1.', '2.', '**']):
        structure_bonus = 0.1
    if '?' in answer:  # clarifying or redirecting question adds quality
        structure_bonus += 0.05

    quality = min(length_score + structure_bonus, 1.0)
    return round(quality, 4)


# ─── Composite Evaluator ─────────────────────────────────────────────────────

def evaluate_response(
    answer: str,
    source_chunks: List[SourceChunk],
    user_feedback_rating: Optional[int] = None
) -> dict:
    """
    Run all 3 signal evaluators and return a composite evaluation dict.
    Optionally blends in user feedback (1-5 stars → 0.0-1.0).
    """
    retrieval = compute_retrieval_score(source_chunks)
    grounding = compute_grounding_score(answer, source_chunks)
    quality = compute_answer_quality(answer)

    # Composite: weighted average
    composite = round(
        (retrieval * 0.30) + (grounding * 0.40) + (quality * 0.30),
        4
    )

    # If human feedback is available, blend it in (20% weight)
    if user_feedback_rating is not None:
        human_score = (user_feedback_rating - 1) / 4.0  # normalize 1-5 → 0-1
        composite = round((composite * 0.8) + (human_score * 0.2), 4)

    potential_gap = retrieval < 0.4 or grounding < 0.3 or composite < 0.4

    return {
        "retrieval_score": retrieval,
        "grounding_score": grounding,
        "answer_quality_score": quality,
        "composite_score": composite,
        "potential_gap": potential_gap,
        "signals": {
            "has_context": len(source_chunks) > 0,
            "context_count": len(source_chunks),
            "answer_length": len(answer),
            "feedback_included": user_feedback_rating is not None
        }
    }
