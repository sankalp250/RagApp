import pytest
from backend.app.db.models.knowledge_gap import KnowledgeGap
from backend.app.ai.intelligence import compute_gap_score


def test_compute_gap_score():
    gap_severe = KnowledgeGap(
        query="Do you ship to Alaska?",
        normalized_query="do you ship to alaska",
        category="NO_RELEVANT_DOCUMENTS",
        frequency=25,
        status="OPEN"
    )
    score_severe = compute_gap_score(gap_severe)
    assert score_severe > 0.5

    gap_mild = KnowledgeGap(
        query="What is your CEO's favorite color?",
        normalized_query="what is your ceos favorite color",
        category="MODEL_ADMITTED_IGNORANCE",
        frequency=1,
        status="OPEN"
    )
    score_mild = compute_gap_score(gap_mild)
    assert score_mild < score_severe
