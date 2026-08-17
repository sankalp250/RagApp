"""
Evaluation Background Job
==========================
Triggered after every assistant message is committed.
Runs the multi-signal evaluation engine and persists results to the DB.
Also re-checks knowledge gaps using the composite score.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.conversation import Message, RetrievalEvidence
from backend.app.db.models.evaluation import Evaluation
from backend.app.db.models.document import DocumentChunk
from backend.app.schemas.chat import SourceChunk
from backend.app.ai.evaluator import evaluate_response
from backend.app.core.logging import logger


async def run_evaluation_job(message_id: str) -> None:
    """
    Background job that evaluates a single assistant message.
    Should be called after message is saved to DB.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Load the assistant message
            stmt = select(Message).where(Message.id == message_id, Message.role == "assistant")
            result = await db.execute(stmt)
            message = result.scalars().first()

            if not message:
                logger.warning(f"Evaluation: message {message_id} not found or not an assistant message.")
                return

            # Check if already evaluated (idempotency)
            eval_stmt = select(Evaluation).where(Evaluation.message_id == message_id)
            eval_result = await db.execute(eval_stmt)
            if eval_result.scalars().first():
                logger.info(f"Evaluation: message {message_id} already evaluated, skipping.")
                return

            # Load retrieval evidence to reconstruct source chunks
            evidence_stmt = (
                select(RetrievalEvidence)
                .where(RetrievalEvidence.message_id == message_id)
                .order_by(RetrievalEvidence.rank)
            )
            evidence_result = await db.execute(evidence_stmt)
            evidence_records = evidence_result.scalars().all()

            # Reconstruct SourceChunk objects from evidence
            source_chunks = [
                SourceChunk(
                    chunk_id=ev.chunk_id,
                    content=ev.context_snippet or "",
                    similarity_score=ev.similarity_score,
                    rank=ev.rank
                )
                for ev in evidence_records
            ]

            # Run evaluation
            eval_result_dict = evaluate_response(
                answer=message.content,
                source_chunks=source_chunks,
                user_feedback_rating=None  # feedback-adjusted re-evaluation happens on feedback submit
            )

            # Save Evaluation record
            evaluation = Evaluation(
                message_id=message_id,
                retrieval_score=eval_result_dict["retrieval_score"],
                grounding_score=eval_result_dict["grounding_score"],
                answer_quality_score=eval_result_dict["answer_quality_score"],
                potential_gap=eval_result_dict["potential_gap"],
                signals=eval_result_dict["signals"]
            )
            db.add(evaluation)
            await db.commit()

            logger.info(
                f"Evaluation complete for message {message_id}: "
                f"retrieval={eval_result_dict['retrieval_score']}, "
                f"grounding={eval_result_dict['grounding_score']}, "
                f"quality={eval_result_dict['answer_quality_score']}, "
                f"composite={eval_result_dict['composite_score']}, "
                f"gap={eval_result_dict['potential_gap']}"
            )

        except Exception as e:
            logger.error(f"Evaluation job failed for message {message_id}: {e}", exc_info=e)


async def re_evaluate_with_feedback(message_id: str, feedback_rating: int) -> None:
    """
    Re-runs evaluation after user submits feedback, blending the human signal.
    Updates existing Evaluation record with the adjusted scores.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Load message + existing evaluation
            msg_stmt = select(Message).where(Message.id == message_id)
            msg_result = await db.execute(msg_stmt)
            message = msg_result.scalars().first()

            eval_stmt = select(Evaluation).where(Evaluation.message_id == message_id)
            eval_result = await db.execute(eval_stmt)
            existing_eval = eval_result.scalars().first()

            if not message or not existing_eval:
                return

            # Load source chunks from evidence
            evidence_stmt = (
                select(RetrievalEvidence)
                .where(RetrievalEvidence.message_id == message_id)
                .order_by(RetrievalEvidence.rank)
            )
            evidence_result = await db.execute(evidence_stmt)
            evidence_records = evidence_result.scalars().all()

            source_chunks = [
                SourceChunk(
                    chunk_id=ev.chunk_id,
                    content=ev.context_snippet or "",
                    similarity_score=ev.similarity_score,
                    rank=ev.rank
                )
                for ev in evidence_records
            ]

            # Re-evaluate with feedback blended in
            eval_result_dict = evaluate_response(
                answer=message.content,
                source_chunks=source_chunks,
                user_feedback_rating=feedback_rating
            )

            # Update existing record
            existing_eval.retrieval_score = eval_result_dict["retrieval_score"]
            existing_eval.grounding_score = eval_result_dict["grounding_score"]
            existing_eval.answer_quality_score = eval_result_dict["answer_quality_score"]
            existing_eval.potential_gap = eval_result_dict["potential_gap"]
            existing_eval.signals = {
                **eval_result_dict["signals"],
                "feedback_rating": feedback_rating
            }
            await db.commit()
            logger.info(f"Re-evaluation with feedback complete for message {message_id}")

        except Exception as e:
            logger.error(f"Re-evaluation with feedback failed for message {message_id}: {e}", exc_info=e)
