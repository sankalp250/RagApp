from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


# ─── Conversation Schemas ────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    visitor_id: str = Field(..., description="Anonymous visitor identifier")
    session_id: Optional[str] = None
    conv_metadata: Dict[str, Any] = {}


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    organization_id: str
    visitor_id: str
    session_id: Optional[str] = None
    status: str
    conv_metadata: Dict[str, Any] = {}


# ─── Chat Message Schemas ────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat message from the widget or API."""
    message: str = Field(..., min_length=1, max_length=5000, description="User's message text")
    visitor_id: str = Field(..., description="Anonymous visitor identifier (from widget cookie/localStorage)")
    session_id: Optional[str] = None
    conversation_id: Optional[str] = Field(None, description="If provided, continues existing conversation")
    stream: bool = Field(False, description="Whether to stream response via SSE")


class SourceChunk(BaseModel):
    """Evidence chunk used to generate the answer."""
    chunk_id: str
    content: str
    similarity_score: float
    rank: int
    # File document fields (legacy)
    document_filename: Optional[str] = None
    # Website / rich attribution fields
    document_id: Optional[str] = None
    source_url: Optional[str] = None
    title: Optional[str] = None
    knowledge_source_id: Optional[str] = None
    crawl_id: Optional[str] = None
    source_type: Optional[str] = None  # "website" | "file"


class ChatResponse(BaseModel):
    """Full non-streaming chat response."""
    conversation_id: str
    message_id: str
    answer: str
    sources: List[SourceChunk] = []
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0
    knowledge_gap_detected: bool = False
    gap_category: Optional[str] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    msg_metadata: Dict[str, Any] = {}


class ConversationHistoryResponse(BaseModel):
    conversation_id: str
    messages: List[MessageResponse]


# ─── Feedback Schemas ────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 (bad) to 5 (excellent)")
    comment: Optional[str] = Field(None, max_length=2000)
