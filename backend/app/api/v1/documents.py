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
    return documents


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
        return document
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
