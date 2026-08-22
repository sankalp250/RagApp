from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, get_current_user
from backend.app.db.models.user import User
from backend.app.schemas.document import DocumentResponse, DocumentStatusResponse, DocumentChunkResponse
from backend.app.domains.documents.service import DocumentService
from backend.app.core.exceptions import DocumentNotFoundException, AgentNotFoundException

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

MAX_FILE_SIZE_MB = 25


@router.get(
    "/agents/{agent_id}/documents",
    response_model=List[DocumentResponse],
    summary="List all documents for an agent"
)
async def list_documents(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all documents (and their ingestion status) for the agent."""
    documents = await DocumentService.list_agent_documents(
        db=db,
        organization_id=current_user.organization_id,
        agent_id=agent_id
    )
    return [
        DocumentResponse(
            id=d.id,
            organization_id=d.organization_id,
            agent_id=d.agent_id,
            filename=d.filename,
            file_size_bytes=d.file_size_bytes or 0,
            mime_type=d.mime_type or "text/plain",
            status=d.status or "READY",
            chunk_count=d.chunk_count or 0,
            error_message=d.error_message,
            created_at=d.created_at.isoformat() if d.created_at else None
        )
        for d in documents
    ]


@router.post(
    "/agents/{agent_id}/documents/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document and start async ingestion"
)
async def upload_document(
    agent_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a PDF, TXT, or DOCX file.
    The document is saved to storage and a background job is queued to
    parse, chunk, embed, and index it. Track progress via GET /documents/{id}/status.
    """
    # MIME type validation
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed: PDF, TXT, DOCX, CSV, Markdown."
        )

    # Read and validate file size
    file_bytes = await file.read()
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum allowed: {MAX_FILE_SIZE_MB}MB."
        )

    try:
        document = await DocumentService.upload_document(
            db=db,
            organization_id=current_user.organization_id,
            agent_id=agent_id,
            filename=file.filename or "unnamed_file",
            file_bytes=file_bytes,
            mime_type=content_type
        )
        return DocumentResponse(
            id=document.id,
            organization_id=document.organization_id,
            agent_id=document.agent_id,
            filename=document.filename,
            file_size_bytes=document.file_size_bytes or len(file_bytes),
            mime_type=document.mime_type or "application/octet-stream",
            status=document.status or "UPLOADED",
            chunk_count=document.chunk_count or 0,
            error_message=document.error_message,
            created_at=document.created_at.isoformat() if document.created_at else None
        )
    except AgentNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


from pydantic import BaseModel

class CrawlUrlRequest(BaseModel):
    url: str

@router.post(
    "/agents/{agent_id}/documents/crawl",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crawl a URL and ingest into vector knowledge base"
)
async def crawl_and_ingest_url(
    agent_id: str,
    payload: CrawlUrlRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crawls a webpage URL (or sitemap page), strips HTML tags to extract clean text,
    and enqueues the async chunking, embedding, and vector indexing pipeline.
    """
    import httpx
    from urllib.parse import urlparse

    target_url = payload.url.strip()
    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        target_url = f"https://{target_url}"

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(target_url)
            resp.raise_for_status()
            html_content = resp.text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not reach or fetch URL '{target_url}': {str(e)}"
        )

    # Extract clean text using Python built-in HTMLParser (zero dependencies)
    import re
    from html.parser import HTMLParser

    class CleanTextHTMLParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.texts = []
            self.skip_depth = 0
            self.skip_tags = {"script", "style", "svg", "noscript", "head"}

        def handle_starttag(self, tag, attrs):
            if tag.lower() in self.skip_tags:
                self.skip_depth += 1

        def handle_endtag(self, tag):
            if tag.lower() in self.skip_tags and self.skip_depth > 0:
                self.skip_depth -= 1

        def handle_data(self, data):
            if self.skip_depth == 0:
                clean = data.strip()
                if clean:
                    self.texts.append(clean)

    parser = CleanTextHTMLParser()
    try:
        parser.feed(html_content)
        clean_text = "\n\n".join(parser.texts)
    except Exception:
        clean_text = re.sub(r"<[^>]+>", " ", html_content)
        clean_text = re.sub(r"\s+", " ", clean_text).strip()

    if not clean_text or len(clean_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The target URL returned empty or unreadable text content."
        )

    parsed = urlparse(target_url)
    display_filename = f"Web: {parsed.netloc}{parsed.path if parsed.path and parsed.path != '/' else ''}"

    try:
        document = await DocumentService.upload_document(
            db=db,
            organization_id=current_user.organization_id,
            agent_id=agent_id,
            filename=display_filename,
            file_bytes=clean_text.encode("utf-8"),
            mime_type="text/markdown"
        )
        return DocumentResponse(
            id=document.id,
            organization_id=document.organization_id,
            agent_id=document.agent_id,
            filename=document.filename,
            file_size_bytes=document.file_size_bytes or len(clean_text),
            mime_type=document.mime_type or "text/markdown",
            status=document.status or "UPLOADED",
            chunk_count=document.chunk_count or 0,
            error_message=document.error_message,
            created_at=document.created_at.isoformat() if document.created_at else None
        )
    except AgentNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/documents/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Get document ingestion status"
)
async def get_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Poll ingestion status: UPLOADED → PROCESSING → READY | FAILED"""
    try:
        doc = await DocumentService.get_document(
            db=db,
            organization_id=current_user.organization_id,
            document_id=document_id
        )
        return doc
    except DocumentNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document and its vector chunks"
)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently removes the document file, its chunks, and DB records."""
    try:
        await DocumentService.delete_document(
            db=db,
            organization_id=current_user.organization_id,
            document_id=document_id
        )
    except DocumentNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
