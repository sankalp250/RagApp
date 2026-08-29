from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Index,
    Boolean,
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin, get_utc_now


class KnowledgeSource(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Root knowledge source configuration for an Agent (e.g. Website, Sitemap, Documents).
    Strictly scoped to both Organization and Agent for multi-tenant isolation.
    """
    __tablename__ = "knowledge_sources"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    agent_id = Column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type = Column(String(50), default="WEBSITE", nullable=False)  # WEBSITE, SITEMAP, DOCUMENT
    name = Column(String(255), nullable=True)
    url = Column(String(1000), nullable=True)
    sitemap_url = Column(String(1000), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, PAUSED, CRAWLING, FAILED
    config = Column(JSON, default=lambda: {
        "max_depth": 2,
        "max_pages": 50,
        "include_subdomains": False,
        "match_patterns": [],
        "exclude_patterns": ["*.pdf", "*.jpg", "*.png", "/cart", "/login", "/checkout"]
    }, nullable=False)
    
    current_version = Column(Integer, default=1, nullable=False)
    last_crawled_at = Column(DateTime(timezone=False), nullable=True)
    last_successful_crawl_at = Column(DateTime(timezone=False), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="knowledge_sources")
    agent = relationship("Agent", back_populates="knowledge_sources")
    crawl_jobs = relationship("CrawlJob", back_populates="knowledge_source", cascade="all, delete-orphan", order_by="desc(CrawlJob.created_at)")
    crawled_pages = relationship("CrawledPage", back_populates="knowledge_source", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="knowledge_source", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_knowledge_sources_org_agent", "organization_id", "agent_id"),
        UniqueConstraint("agent_id", "type", "url", name="uq_agent_source_url"),
    )


class CrawlJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Auditable history of website crawl execution jobs.
    """
    __tablename__ = "crawl_jobs"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    agent_id = Column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    knowledge_source_id = Column(
        String(36),
        ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = Column(String(50), default="QUEUED", nullable=False)  # QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    trigger_type = Column(String(50), default="MANUAL", nullable=False)  # MANUAL, SCHEDULED, REINDEX, WIDGET_BOOTSTRAP, RECRAWL
    started_at = Column(DateTime(timezone=False), nullable=True)
    completed_at = Column(DateTime(timezone=False), nullable=True)
    
    pages_discovered = Column(Integer, default=0, nullable=False)
    pages_processed = Column(Integer, default=0, nullable=False)
    pages_failed = Column(Integer, default=0, nullable=False)
    pages_unchanged = Column(Integer, default=0, nullable=False)
    pages_changed = Column(Integer, default=0, nullable=False)
    pages_new = Column(Integer, default=0, nullable=False)
    pages_removed = Column(Integer, default=0, nullable=False)
    crawl_version = Column(Integer, default=1, nullable=False)
    error_summary = Column(Text, nullable=True)
    job_metadata = Column(JSON, default=dict, nullable=False)

    # Relationships
    knowledge_source = relationship("KnowledgeSource", back_populates="crawl_jobs")
    agent = relationship("Agent", back_populates="crawl_jobs")
    organization = relationship("Organization")
    crawl_runs = relationship("CrawlRun", back_populates="crawl_job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_crawl_jobs_source_status", "knowledge_source_id", "status"),
        Index("ix_crawl_jobs_org_created", "organization_id", "created_at"),
    )


class CrawlRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Detailed execution run step within a crawl job.
    """
    __tablename__ = "crawl_runs"

    crawl_job_id = Column(
        String(36),
        ForeignKey("crawl_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    agent_id = Column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, RUNNING, SUCCESS, FAILED
    started_at = Column(DateTime(timezone=False), nullable=True)
    completed_at = Column(DateTime(timezone=False), nullable=True)
    pages_crawled = Column(Integer, default=0, nullable=False)
    pages_unchanged = Column(Integer, default=0, nullable=False)
    pages_changed = Column(Integer, default=0, nullable=False)
    pages_new = Column(Integer, default=0, nullable=False)
    pages_removed = Column(Integer, default=0, nullable=False)
    errors = Column(JSON, default=list, nullable=False)

    # Relationships
    crawl_job = relationship("CrawlJob", back_populates="crawl_runs")


class CrawledPage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Individual discovered and ingested web page belonging to a KnowledgeSource.
    Tracks canonical URL, content hash for incremental RAG deduplication, change status, and crawl version.
    """
    __tablename__ = "crawled_pages"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    agent_id = Column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    knowledge_source_id = Column(
        String(36),
        ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    url = Column(String(1000), nullable=False)
    canonical_url = Column(String(1000), nullable=True)
    title = Column(String(500), nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)  # Current SHA-256 hash of extracted textual content
    previous_hash = Column(String(64), nullable=True)  # SHA-256 hash prior to the most recent modification
    change_status = Column(String(50), default="NEW", nullable=False)  # NEW, CHANGED, UNCHANGED, REMOVED
    status = Column(String(50), default="DISCOVERED", nullable=False)  # DISCOVERED, CRAWLED, PROCESSED, INDEXED, UNCHANGED, FAILED, SKIPPED, DEPRECATED
    http_status = Column(Integer, nullable=True)
    depth = Column(Integer, default=0, nullable=False)
    crawl_version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    page_metadata = Column(JSON, default=dict, nullable=False)
    error_message = Column(Text, nullable=True)
    
    last_crawled_at = Column(DateTime(timezone=False), nullable=True)
    last_changed_at = Column(DateTime(timezone=False), nullable=True)

    # Relationships
    knowledge_source = relationship("KnowledgeSource", back_populates="crawled_pages")
    agent = relationship("Agent", back_populates="crawled_pages")
    organization = relationship("Organization")
    documents = relationship("Document", back_populates="source_page")

    __table_args__ = (
        UniqueConstraint("knowledge_source_id", "url", name="uq_source_page_url"),
        Index("ix_crawled_pages_org_agent", "organization_id", "agent_id"),
        Index("ix_crawled_pages_source_status", "knowledge_source_id", "status"),
        Index("ix_crawled_pages_change_status", "knowledge_source_id", "change_status"),
    )
