from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.db.models.document import Document, DocumentChunk
from backend.app.domains.documents.storage import get_storage_backend
from backend.app.ai.chunking.extractors import TextExtractor
from backend.app.ai.chunking.splitter import RecursiveCharacterTextSplitter
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.core.logging import logger


async def process_document_job(document_id: str) -> None:
    """
    Background worker job:
    1. Reads document file from storage
    2. Extracts text
    3. Chunks text
    4. Generates vector embeddings
    5. Saves DocumentChunks to DB
    6. Updates Document status to READY or FAILED
    """
    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalars().first()

        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        try:
            # Update status to PROCESSING
            doc.status = "PROCESSING"
            await db.commit()

            # Read file from storage
            storage = get_storage_backend()
            file_bytes = await storage.read_file(doc.storage_path)

            # Extract text
            extracted_text, metadata = TextExtractor.extract_text(
                file_bytes=file_bytes,
                filename=doc.filename,
                mime_type=doc.mime_type or "text/plain"
            )

            if not extracted_text.strip():
                raise ValueError("No extractable text found in document.")

            # Chunk document
            splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
            chunks_text = splitter.split_text(extracted_text)

            if not chunks_text:
                raise ValueError("Document yielded 0 chunks after splitting.")

            # Generate embeddings
            embedding_provider = EmbeddingService.get_provider()
            embeddings = await embedding_provider.embed_texts(chunks_text)

            # Persist chunks
            for idx, (chunk_text, emb) in enumerate(zip(chunks_text, embeddings)):
                chunk = DocumentChunk(
                    document_id=doc.id,
                    agent_id=doc.agent_id,
                    organization_id=doc.organization_id,
                    chunk_index=idx,
                    content=chunk_text,
                    embedding=emb,
                    chunk_metadata={
                        "chunk_index": idx,
                        "char_count": len(chunk_text),
                        "filename": doc.filename
                    }
                )
                db.add(chunk)

            doc.chunk_count = len(chunks_text)
            doc.status = "READY"
            doc.doc_metadata = {**doc.doc_metadata, **metadata, "total_chunks": len(chunks_text)}
            await db.commit()
            logger.info(f"Document {doc.filename} ({doc.id}) processed successfully into {len(chunks_text)} chunks.")

        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}", exc_info=e)
            doc.status = "FAILED"
            doc.error_message = str(e)
            await db.commit()
