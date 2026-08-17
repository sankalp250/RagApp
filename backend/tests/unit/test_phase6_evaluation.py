import pytest
from backend.app.schemas.chat import SourceChunk
from backend.app.ai.evaluator import (
    compute_retrieval_score,
    compute_grounding_score,
    compute_answer_quality,
    evaluate_response
)
from backend.app.ai.knowledge_gap import detect_knowledge_gap


def test_retrieval_score_empty():
    assert compute_retrieval_score([]) == 0.0


def test_retrieval_score_high():
    chunks = [
        SourceChunk(chunk_id="1", content="Text 1", similarity_score=0.85, rank=1),
        SourceChunk(chunk_id="2", content="Text 2", similarity_score=0.75, rank=2)
    ]
    score = compute_retrieval_score(chunks)
    assert 0.8 <= score <= 1.0


def test_grounding_score_ungrounded():
    chunks = [SourceChunk(chunk_id="1", content="Our return policy is 30 days.", similarity_score=0.9, rank=1)]
    score = compute_grounding_score("I don't have information on that topic.", chunks)
    assert score == 0.1


def test_grounding_score_grounded():
    chunks = [SourceChunk(chunk_id="1", content="Acme returns must be requested within 30 days of delivery.", similarity_score=0.9, rank=1)]
    score = compute_grounding_score("According to our policy, returns must be requested within 30 days of delivery.", chunks)
    assert score >= 0.5


def test_answer_quality_poor():
    assert compute_answer_quality("") == 0.0
    assert compute_answer_quality("Hi") <= 0.3
    assert compute_answer_quality("I cannot help with that question, please contact human support.") == 0.2


def test_answer_quality_good():
    answer = (
        "To initiate a return with Acme Furniture:\n"
        "- 1. Visit your account dashboard and locate your order\n"
        "- 2. Click 'Request Return' and select the reason for return\n"
        "- 3. Print the pre-paid shipping label and attach it to the original packaging\n"
        "Do you need help finding your order number?"
    )
    quality = compute_answer_quality(answer)
    assert quality >= 0.8


def test_composite_evaluation_with_feedback():
    chunks = [SourceChunk(chunk_id="1", content="Store hours are Monday through Friday 9am to 6pm.", similarity_score=0.88, rank=1)]
    answer = "Based on our schedule, our store hours are Monday to Friday from 9am to 6pm."
    
    # 5-star rating boosts composite
    eval_5star = evaluate_response(answer, chunks, user_feedback_rating=5)
    assert eval_5star["composite_score"] >= 0.6
    assert eval_5star["potential_gap"] is False

    # 1-star rating penalizes composite
    eval_1star = evaluate_response(answer, chunks, user_feedback_rating=1)
    assert eval_1star["composite_score"] < eval_5star["composite_score"]


def test_knowledge_gap_detection_signals():
    # Signal 1: Empty chunks
    is_gap, cat = detect_knowledge_gap("What is the warranty?", "I can't answer.", [])
    assert is_gap is True
    assert cat == "NO_RELEVANT_DOCUMENTS"

    # Signal 2: Low confidence similarity
    low_chunks = [SourceChunk(chunk_id="1", content="Random text", similarity_score=0.2, rank=1)]
    is_gap, cat = detect_knowledge_gap("What is the warranty?", "Some answer", low_chunks)
    assert is_gap is True
    assert cat == "LOW_CONFIDENCE_RETRIEVAL"

    # Signal 3: Model admitted ignorance despite having chunks
    good_chunks = [SourceChunk(chunk_id="1", content="Pricing list", similarity_score=0.8, rank=1)]
    is_gap, cat = detect_knowledge_gap("What is the return policy?", "I do not have enough information to answer.", good_chunks)
    assert is_gap is True
    assert cat == "MODEL_ADMITTED_IGNORANCE"
