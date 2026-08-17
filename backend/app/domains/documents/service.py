from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid

from backend.app.db.models.document import Document, DocumentChunk
from backend.app.db.models.agent import Agent
from backend.app.domains.documents.storage import get_storage_backend
from backend.app.workers.queue import job_queue
from backend.app.workers.document_jobs import process_document_job
from backend.app.core.exceptions import DocumentNotFoundException, AgentNotFoundException


class DocumentService:
    @staticmethod
    async def list_agent_documents(db: AsyncSession, organization_id: str, agent_id: str) -> List[Document]:
        """List documents belonging to an agent within tenant boundaries."""
        stmt = (
            select(Document)
            .where(
                Document.organization_id == organization_id,
                Document.agent_id == agent_id
            )
            .order_by(Document.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_document(db: AsyncSession, organization_id: str, document_id: str) -> Document:
        """Fetch document ensuring tenant boundary."""
        stmt = (
            select(Document)
            .where(
                Document.id == document_id,
                Document.organization_id == organization_id
            )
        )
        result = await db.execute(stmt)
        doc = result.scalars().first()
        if not doc:
            raise DocumentNotFoundException(f"Document '{document_id}' not found in this organization")
        return doc

    @staticmethod
    async def upload_document(
        db: AsyncSession,
        organization_id: str,
        agent_id: str,
        filename: str,
        file_bytes: bytes,
        mime_type: str
    ) -> Document:
        """Saves file to storage, creates Document record, and queues async ingestion job."""
        # 1. Verify agent exists in organization
        stmt_agent = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
        res_agent = await db.execute(stmt_agent)
        if not res_agent.scalars().first():
            raise AgentNotFoundException(f"Agent '{agent_id}' not found in this organization")

        # 2. Save file
        storage = get_storage_backend()
        unique_filename = f"{organization_id}/{agent_id}/{uuid.uuid4()}_{filename}"
        storage_path = await storage.save_file(file_bytes, unique_filename)

        # 3. Create Document DB record
        doc = Document(
            organization_id=organization_id,
            agent_id=agent_id,
            filename=filename,
            storage_path=storage_path,
            file_size_bytes=len(file_bytes),
            mime_type=mime_type or "text/plain",
            status="UPLOADED"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        # 4. Trigger asynchronous processing job
        job_queue.enqueue(process_document_job, doc.id)

        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, organization_id: str, document_id: str) -> bool:
        """Deletes document, chunks, and physical file."""
        doc = await DocumentService.get_document(db, organization_id, document_id)
        storage = get_storage_backend()
        await storage.delete_file(doc.storage_path)

        await db.delete(doc)
        await db.commit()
        return True
