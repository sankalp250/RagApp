from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, JSON, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class KnowledgeGap(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "knowledge_gaps"

    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Synthesized semantic topic title (e.g. "Delivery Address Changes")
    topic = Column(String(255), nullable=True, index=True)

    # Primary representative query and normalized form
    query = Column(Text, nullable=False)
    normalized_query = Column(Text, nullable=False, index=True)

    # Question variations clustered under this topic (e.g. ["Can I change address?", "Modify shipping address?"])
    sample_questions = Column(JSON, default=list, nullable=False)

    # Detection metadata & aggregation
    category = Column(String(100), nullable=True)   # NO_RELEVANT_DOCUMENTS, LOW_CONFIDENCE_RETRIEVAL, MODEL_ADMITTED_IGNORANCE, NEGATIVE_FEEDBACK
    frequency = Column(Integer, default=1, nullable=False)
    confidence = Column(Float, default=0.5, nullable=False)  # 0.0 - 1.0 confidence/severity score
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, REVIEWED, RESOLVED

    # Centroid vector embedding for semantic similarity clustering
    embedding = Column(JSON, nullable=True)

    # Aggregated retrieval metrics & user feedback signals
    retrieval_metrics = Column(JSON, default=dict, nullable=False)  # avg_retrieval_score, avg_grounding_score, avg_quality_score
    feedback_metrics = Column(JSON, default=dict, nullable=False)   # thumbs_down_count, negative_comments

    # Temporal tracking
    first_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Snapshot of top chunks at time of detection (for analyst review)
    top_chunks_context = Column(JSON, default=list, nullable=False)

    # AI-generated suggestion fields
    recommended_action = Column(Text, nullable=True)
    gap_score = Column(Float, default=0.0, nullable=False)
    gap_metadata = Column(JSON, default=dict, nullable=False)

    # Relationships
    agent = relationship("Agent", back_populates="knowledge_gaps")
    evidence_records = relationship("GapEvidence", back_populates="knowledge_gap", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_knowledge_gaps_org_agent_status", "organization_id", "agent_id", "status"),
        Index("ix_knowledge_gaps_org_freq", "organization_id", "frequency"),
    )


class GapEvidence(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gap_evidence"

    gap_id = Column(String(36), ForeignKey("knowledge_gaps.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    gap_category = Column(String(100), nullable=True)

    knowledge_gap = relationship("KnowledgeGap", back_populates="evidence_records")
    message = relationship("Message", back_populates="gap_evidence")
