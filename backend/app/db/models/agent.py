import json
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin, generate_uuid


class Agent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "agents"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    model = Column(String(100), default="gemini-2.5-flash", nullable=False)
    system_prompt = Column(
        Text,
        default="You are a helpful and polite customer support AI agent. Answer questions using the provided knowledge documents. If you do not have sufficient information in the context to answer accurately, politely state that you do not know and suggest reaching out to human support.",
        nullable=False
    )
    configuration = Column(JSON, default=lambda: {
        "temperature": 0.3,
        "max_tokens": 800,
        "greeting_message": "Hello! How can I help you today?",
        "primary_color": "#2563eb",
        "bot_title": "AI Assistant",
        "placeholder_text": "Ask a question...",
        "suggested_questions": ["What are your business hours?", "How do returns work?"]
    }, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)
    public_key = Column(String(64), default=generate_uuid, index=True, nullable=False)

    organization = relationship("Organization", back_populates="agents")
    documents = relationship("Document", back_populates="agent", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")
    knowledge_gaps = relationship("KnowledgeGap", back_populates="agent", cascade="all, delete-orphan")
