from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    agent_id: str
    filename: str
    file_size_bytes: int
    mime_type: str
    status: str
    chunk_count: int
    error_message: Optional[str] = None
    created_at: str


class DocumentStatusResponse(BaseModel):
    id: str
    filename: str
    status: str
    chunk_count: int
    error_message: Optional[str] = None


class DocumentChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chunk_index: int
    content: str
    chunk_metadata: Dict[str, Any]
