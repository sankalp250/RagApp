from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, Index, Boolean
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Core document model representing an ingested knowledge document or crawled webpage text.
    Strictly scoped to both Organization and Agent.
    """
    __tablename__ = "documents"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    knowledge_source_id = Column(String(36), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    source_page_id = Column(String(36), ForeignKey("crawled_pages.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(500), nullable=True)
    source_url = Column(String(1000), nullable=True)
    canonical_url = Column(String(1000), nullable=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="text/plain")
    content = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)  # SHA-256 for fast deduplication check
    previous_hash = Column(String(64), nullable=True)  # Previous SHA-256 hash prior to modification
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="UPLOADED", nullable=False)  # UPLOADED, PROCESSING, READY, FAILED, DELETED, DEPRECATED
    error_message = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0, nullable=False)
    doc_metadata = Column(JSON, default=dict, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="documents")
    agent = relationship("Agent", back_populates="documents")
    knowledge_source = relationship("KnowledgeSource", back_populates="documents")
    source_page = relationship("CrawledPage", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_documents_org_agent", "organization_id", "agent_id"),
        Index("ix_documents_org_agent_active_status", "organization_id", "agent_id", "is_active", "status"),
        Index("ix_documents_source_url", "source_url"),
        Index("ix_documents_ks_url", "knowledge_source_id", "source_url"),
    )


class DocumentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Vector chunk derived from a Document with embedding and content hash.
    """
    __tablename__ = "document_chunks"

    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=True, index=True)
    embedding = Column(JSON, nullable=True)  # JSON array of floats for broad compatibility
    chunk_metadata = Column(JSON, default=dict, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    evidence_records = relationship("RetrievalEvidence", back_populates="chunk", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_document_chunks_org_agent", "organization_id", "agent_id"),
        Index("ix_document_chunks_org_agent_doc", "organization_id", "agent_id", "document_id"),
        Index("ix_document_chunks_doc_index", "document_id", "chunk_index"),
    )
