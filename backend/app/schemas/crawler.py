from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class CreateWebsiteSourceRequest(BaseModel):
    agent_id: str = Field(..., description="Target Agent UUID")
    url: str = Field(..., description="Root website URL to crawl (e.g. https://example.com)")
    sitemap_url: Optional[str] = Field(None, description="Optional XML sitemap URL (e.g. https://example.com/sitemap.xml)")
    name: Optional[str] = Field(None, description="Display name for this knowledge source")
    max_depth: Optional[int] = Field(2, ge=1, le=10, description="Maximum link crawl depth")
    max_pages: Optional[int] = Field(50, ge=1, le=5000, description="Maximum pages to discover & process")
    include_subdomains: Optional[bool] = Field(False, description="Whether to follow links across subdomains")
    match_patterns: Optional[List[str]] = Field(default_factory=list, description="URL glob/regex match rules")
    exclude_patterns: Optional[List[str]] = Field(default_factory=list, description="URL glob/regex exclude rules")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        clean = v.strip()
        if not clean.startswith("http://") and not clean.startswith("https://"):
            clean = f"https://{clean}"
        return clean


class TriggerCrawlRequest(BaseModel):
    trigger_type: Optional[str] = Field("MANUAL", description="Trigger mechanism: MANUAL, SCHEDULED, REINDEX")
    max_pages: Optional[int] = Field(None, ge=1, le=5000, description="Override maximum page crawl budget")


class CrawlJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    agent_id: str
    knowledge_source_id: str
    status: str
    trigger_type: str
    started_at: Optional[Union[datetime, str]] = None
    completed_at: Optional[Union[datetime, str]] = None
    pages_discovered: int = 0
    pages_processed: int = 0
    pages_failed: int = 0
    pages_unchanged: int = 0
    pages_changed: int = 0
    pages_new: int = 0
    pages_removed: int = 0
    crawl_version: int = 1
    error_summary: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None


class KnowledgeSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    agent_id: str
    type: str
    name: Optional[str] = None
    url: Optional[str] = None
    sitemap_url: Optional[str] = None
    status: str
    config: Dict[str, Any] = Field(default_factory=dict)
    current_version: int = 1
    last_crawled_at: Optional[Union[datetime, str]] = None
    last_successful_crawl_at: Optional[Union[datetime, str]] = None
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None
    total_pages_count: int = 0


class CrawlStatusResponse(BaseModel):
    knowledge_source_id: str
    organization_id: str
    agent_id: str
    status: str
    url: Optional[str] = None
    sitemap_url: Optional[str] = None
    current_version: int = 1
    last_crawled_at: Optional[Union[datetime, str]] = None
    last_successful_crawl_at: Optional[Union[datetime, str]] = None
    total_pages: int = 0
    discovered_pages: int = 0
    processed_pages: int = 0
    failed_pages: int = 0
    unchanged_pages: int = 0
    changed_pages: int = 0
    new_pages: int = 0
    removed_pages: int = 0
    active_job: Optional[CrawlJobResponse] = None
    latest_job: Optional[CrawlJobResponse] = None


class CrawledPageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    agent_id: str
    knowledge_source_id: str
    url: str
    canonical_url: Optional[str] = None
    title: Optional[str] = None
    content_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    change_status: str = "NEW"
    status: str
    http_status: Optional[int] = None
    depth: int = 0
    crawl_version: int = 1
    is_active: bool = True
    error_message: Optional[str] = None
    last_crawled_at: Optional[Union[datetime, str]] = None
    last_changed_at: Optional[Union[datetime, str]] = None
    created_at: Optional[Union[datetime, str]] = None


class PaginatedCrawledPagesResponse(BaseModel):
    items: List[CrawledPageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CrawlChangesSummary(BaseModel):
    new_count: int = 0
    changed_count: int = 0
    removed_count: int = 0
    unchanged_count: int = 0
    total_pages: int = 0


class CrawlChangesResponse(BaseModel):
    knowledge_source_id: str
    crawl_job_id: Optional[str] = None
    crawl_version: int = 1
    summary: CrawlChangesSummary
    new_pages: List[CrawledPageResponse] = Field(default_factory=list)
    changed_pages: List[CrawledPageResponse] = Field(default_factory=list)
    removed_pages: List[CrawledPageResponse] = Field(default_factory=list)
    unchanged_pages: List[CrawledPageResponse] = Field(default_factory=list)


class CrawlRunsListResponse(BaseModel):
    knowledge_source_id: str
    total_runs: int
    runs: List[CrawlJobResponse]


class WidgetBootstrapRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent_id: Optional[str] = Field(None, description="Agent UUID or public key")
    public_key: Optional[str] = Field(None, description="Agent public key")
    origin: Optional[str] = Field(None, description="Browser window.location.origin (e.g. https://example.com)")
    current_site_origin: Optional[str] = Field(None, description="Alias for origin used by embed widget.js")
    force_retry: Optional[bool] = Field(False, description="Explicit request to retry a failed crawl")

    @model_validator(mode="after")
    def resolve_origin(self) -> "WidgetBootstrapRequest":
        if not self.origin and self.current_site_origin:
            self.origin = self.current_site_origin
        if not self.origin:
            self.origin = "http://localhost"
        return self


class WidgetBootstrapResponse(BaseModel):
    agent_id: str
    public_key: str
    widget_ready: bool = True
    knowledge_status: str = Field("ready", description="not_started, processing, ready, failed, unauthorized")
    crawl_triggered: bool = False
    crawl_job_id: Optional[str] = None
    bot_title: str = "AI Assistant"
    greeting_message: str = "Hello! How can I help you today?"
    primary_color: str = "#2563eb"
    placeholder_text: str = "Ask a question..."
    suggested_questions: List[str] = Field(default_factory=list)
    message: Optional[str] = None
    error: Optional[str] = None

