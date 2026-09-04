"""
Evaluation Background Job
==========================
Triggered after every assistant message is committed.
Runs the multi-signal evaluation engine and persists results to the DB.
Asynchronously detects Knowledge Gap failure candidates and triggers
semantic topic clustering and aggregation.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.conversation import Message, Conversation, RetrievalEvidence
from backend.app.db.models.evaluation import Evaluation
from backend.app.db.models.document import DocumentChunk
from backend.app.schemas.chat import SourceChunk
from backend.app.ai.evaluator import evaluate_response
from backend.app.ai.knowledge_gap import record_knowledge_gap_with_clustering
from backend.app.core.logging import logger


async def run_evaluation_job(message_id: str) -> None:
    """
    Background job that evaluates a single assistant message asynchronously.
    Executes entirely in the background with zero chat latency impact.
    """
    async with AsyncSessionLocal() as db:
        try:
            # 1. Load the assistant message and conversation
            stmt = select(Message).where(Message.id == message_id, Message.role == "assistant")
            result = await db.execute(stmt)
            message = result.scalars().first()

            if not message:
                logger.warning(f"[Evaluation] Message {message_id} not found or not an assistant message.")
                return

            # Check if already evaluated (idempotency)
            eval_stmt = select(Evaluation).where(Evaluation.message_id == message_id)
            eval_result = await db.execute(eval_stmt)
            if eval_result.scalars().first():
                logger.info(f"[Evaluation] Message {message_id} already evaluated, skipping.")
                return

            # 2. Load conversation metadata & user triggering query
            conv_stmt = select(Conversation).where(Conversation.id == message.conversation_id)
            conv_res = await db.execute(conv_stmt)
            conversation = conv_res.scalars().first()

            agent_id = str(conversation.agent_id) if conversation else ""
            organization_id = str(conversation.organization_id) if conversation else ""

            # Load preceding messages in this conversation for context
            history_stmt = (
                select(Message)
                .where(Message.conversation_id == message.conversation_id)
                .order_by(Message.created_at)
            )
            history_res = await db.execute(history_stmt)
            all_msgs = history_res.scalars().all()

            user_query = ""
            conv_history_list = []
            for m in all_msgs:
                conv_history_list.append({"role": m.role, "content": m.content})
                if m.role == "user" and m.created_at <= message.created_at:
                    user_query = m.content

            # 3. Load retrieval evidence to reconstruct source chunks
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

            # 4. Run Multi-Signal Evaluation
            eval_result_dict = evaluate_response(
                answer=message.content,
                source_chunks=source_chunks,
                user_query=user_query,
                conversation_history=conv_history_list,
                user_feedback_rating=None
            )

            # 5. Save Evaluation Record
            evaluation = Evaluation(
                message_id=message_id,
                retrieval_score=eval_result_dict["retrieval_score"],
                grounding_score=eval_result_dict["grounding_score"],
                answer_quality_score=eval_result_dict["answer_quality_score"],
                potential_gap=eval_result_dict["is_failure_candidate"],
                signals=eval_result_dict["signals"]
            )
            db.add(evaluation)
            await db.commit()

            # 6. If Failure Candidate detected -> Trigger Semantic Knowledge Gap Clustering
            if eval_result_dict["is_failure_candidate"] and user_query and agent_id and organization_id:
                await record_knowledge_gap_with_clustering(
                    db=db,
                    agent_id=agent_id,
                    organization_id=organization_id,
                    message_id=message_id,
                    user_query=user_query,
                    gap_category=eval_result_dict["failure_category"],
                    source_chunks=source_chunks,
                    retrieval_score=eval_result_dict["retrieval_score"],
                    grounding_score=eval_result_dict["grounding_score"],
                    answer_quality_score=eval_result_dict["answer_quality_score"]
                )

            logger.info(
                f"[Evaluation] Completed for message {message_id}: "
                f"retrieval={eval_result_dict['retrieval_score']}, "
                f"grounding={eval_result_dict['grounding_score']}, "
                f"quality={eval_result_dict['answer_quality_score']}, "
                f"composite={eval_result_dict['composite_score']}, "
                f"gap_candidate={eval_result_dict['is_failure_candidate']}"
            )

        except Exception as e:
            logger.error(f"[Evaluation] Job failed for message {message_id}: {e}", exc_info=e)


async def re_evaluate_with_feedback(message_id: str, feedback_rating: int, comment: Optional[str] = None) -> None:
    """
    Re-evaluates a turn after human feedback (e.g. thumbs down), updating evaluation
    and adjusting knowledge gap confidence and clustering.
    """
    async with AsyncSessionLocal() as db:
        try:
            # 1. Load message, conversation, and existing evaluation
            msg_stmt = select(Message).where(Message.id == message_id)
            msg_result = await db.execute(msg_stmt)
            message = msg_result.scalars().first()

            eval_stmt = select(Evaluation).where(Evaluation.message_id == message_id)
            eval_result = await db.execute(eval_stmt)
            existing_eval = eval_result.scalars().first()

            if not message or not existing_eval:
                return

            conv_stmt = select(Conversation).where(Conversation.id == message.conversation_id)
            conv_res = await db.execute(conv_stmt)
            conversation = conv_res.scalars().first()

            agent_id = str(conversation.agent_id) if conversation else ""
            organization_id = str(conversation.organization_id) if conversation else ""

            # 2. Load evidence
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

            # 3. Find triggering query
            history_stmt = (
                select(Message)
                .where(Message.conversation_id == message.conversation_id)
                .order_by(Message.created_at)
            )
            history_res = await db.execute(history_stmt)
            all_msgs = history_res.scalars().all()
            user_query = ""
            for m in all_msgs:
                if m.role == "user" and m.created_at <= message.created_at:
                    user_query = m.content

            # 4. Re-evaluate with human feedback signal
            eval_result_dict = evaluate_response(
                answer=message.content,
                source_chunks=source_chunks,
                user_query=user_query,
                user_feedback_rating=feedback_rating
            )

            existing_eval.retrieval_score = eval_result_dict["retrieval_score"]
            existing_eval.grounding_score = eval_result_dict["grounding_score"]
            existing_eval.answer_quality_score = eval_result_dict["answer_quality_score"]
            existing_eval.potential_gap = eval_result_dict["is_failure_candidate"]
            existing_eval.signals = {
                **eval_result_dict["signals"],
                "feedback_rating": feedback_rating,
                "feedback_comment": comment
            }
            await db.commit()

            # 5. If negative feedback, ensure knowledge gap is recorded/updated
            if feedback_rating <= 2 and user_query and agent_id and organization_id:
                await record_knowledge_gap_with_clustering(
                    db=db,
                    agent_id=agent_id,
                    organization_id=organization_id,
                    message_id=message_id,
                    user_query=user_query,
                    gap_category="NEGATIVE_FEEDBACK",
                    source_chunks=source_chunks,
                    retrieval_score=eval_result_dict["retrieval_score"],
                    grounding_score=eval_result_dict["grounding_score"],
                    answer_quality_score=eval_result_dict["answer_quality_score"],
                    user_feedback_rating=feedback_rating,
                    feedback_comment=comment
                )

            logger.info(f"[Evaluation] Re-evaluation with feedback complete for message {message_id}")

        except Exception as e:
            logger.error(f"[Evaluation] Re-evaluation with feedback failed for message {message_id}: {e}", exc_info=e)

