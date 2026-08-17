"""
Document Ingestion Worker
==========================
Asynchronous background job processor for knowledge base document parsing,
chunking, embedding generation, and vector indexing.

Module Connections:
  - backend.app.domains.documents.storage -> Reads uploaded raw files from storage backend
  - backend.app.ai.chunking.extractors    -> Extracts text from PDF, DOCX, TXT, CSV, MD
  - backend.app.ai.chunking.splitter      -> Recursive character chunker with overlap
  - backend.app.ai.embeddings.service     -> Generates dense vector embeddings (Gemini/OpenAI/Local)
  - backend.app.db.models.document        -> Persists Document and DocumentChunk records

Lifecycle:
  UPLOADED -> PROCESSING -> READY (or FAILED with error message)
"""
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
      1. Reads document file bytes from configured storage backend
      2. Extracts raw text based on file format (PDF, DOCX, TXT)
      3. Splits text into semantic chunks with overlap (600 chars / 80 overlap)
      4. Generates dense vector embeddings via EmbeddingService
      5. Saves DocumentChunks to DB linked to agent and organization
      6. Updates Document status to READY or FAILED with chunk count

    Args:
      document_id: UUID of the Document record to ingest
    """
    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalars().first()

        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        try:
            # Step 1: Transition status to PROCESSING
            doc.status = "PROCESSING"
            await db.commit()

            # Step 2: Read raw file bytes from storage
            storage = get_storage_backend()
            file_bytes = await storage.read_file(doc.storage_path)

            # Step 3: Extract text and metadata
            extracted_text, metadata = TextExtractor.extract_text(
                file_bytes=file_bytes,
                filename=doc.filename,
                mime_type=doc.mime_type or "text/plain"
            )

            if not extracted_text.strip():
                raise ValueError("No extractable text found in document.")

            # Step 4: Chunk document with recursive splitter
            splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
            chunks_text = splitter.split_text(extracted_text)

            if not chunks_text:
                raise ValueError("Document yielded 0 chunks after splitting.")

            # Step 5: Generate dense vector embeddings for all chunks
            embedding_provider = EmbeddingService.get_provider()
            embeddings = await embedding_provider.embed_texts(chunks_text)

            # Step 6: Persist DocumentChunk records to database
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

            # Step 7: Finalize Document state as READY
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
