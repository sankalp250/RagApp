from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class Conversation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "conversations"

    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    visitor_id = Column(String(255), index=True, nullable=False)
    session_id = Column(String(255), index=True, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, CLOSED, ESCALATED
    conv_metadata = Column(JSON, default=dict, nullable=False)

    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Float, default=0.0, nullable=False)
    msg_metadata = Column(JSON, default=dict, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    retrieval_evidence = relationship("RetrievalEvidence", back_populates="message", cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="message", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="message", cascade="all, delete-orphan")
    gap_evidence = relationship("GapEvidence", back_populates="message", cascade="all, delete-orphan")


class RetrievalEvidence(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "retrieval_evidence"

    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    context_snippet = Column(Text, nullable=True)

    message = relationship("Message", back_populates="retrieval_evidence")
    chunk = relationship("DocumentChunk", back_populates="evidence_records")
