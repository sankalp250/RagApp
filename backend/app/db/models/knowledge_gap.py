from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class KnowledgeGap(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "knowledge_gaps"

    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Raw query and normalized form for deduplication
    query = Column(Text, nullable=False)
    normalized_query = Column(Text, nullable=False, index=True)

    # Detection metadata
    category = Column(String(100), nullable=True)   # NO_RELEVANT_DOCUMENTS, LOW_CONFIDENCE_RETRIEVAL, MODEL_ADMITTED_IGNORANCE
    frequency = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, REVIEWED, RESOLVED

    # Snapshot of top chunks at time of detection (for analyst review)
    top_chunks_context = Column(JSON, default=list, nullable=False)

    # AI-generated suggestion fields (populated in Phase 7 intelligence layer)
    recommended_action = Column(Text, nullable=True)
    gap_score = Column(Float, default=0.0, nullable=False)
    gap_metadata = Column(JSON, default=dict, nullable=False)

    agent = relationship("Agent", back_populates="knowledge_gaps")
    evidence_records = relationship("GapEvidence", back_populates="knowledge_gap", cascade="all, delete-orphan")


class GapEvidence(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gap_evidence"

    gap_id = Column(String(36), ForeignKey("knowledge_gaps.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    gap_category = Column(String(100), nullable=True)

    knowledge_gap = relationship("KnowledgeGap", back_populates="evidence_records")
    message = relationship("Message", back_populates="gap_evidence")
