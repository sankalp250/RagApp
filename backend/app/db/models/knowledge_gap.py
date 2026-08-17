from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class KnowledgeGap(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "knowledge_gaps"

    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    suggested_questions = Column(JSON, default=list, nullable=False)
    occurrence_count = Column(Integer, default=1, nullable=False)
    success_rate = Column(Float, default=0.0, nullable=False)
    gap_score = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="DETECTED", nullable=False)  # DETECTED, REVIEWED, CONTENT_ADDED, RESOLVED
    cluster_centroid = Column(JSON, nullable=True)
    gap_metadata = Column(JSON, default=dict, nullable=False)

    agent = relationship("Agent", back_populates="knowledge_gaps")
    evidence_records = relationship("GapEvidence", back_populates="knowledge_gap", cascade="all, delete-orphan")


class GapEvidence(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gap_evidence"

    knowledge_gap_id = Column(String(36), ForeignKey("knowledge_gaps.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    failure_reason = Column(String(255), nullable=True)

    knowledge_gap = relationship("KnowledgeGap", back_populates="evidence_records")
    message = relationship("Message", back_populates="gap_evidence")
