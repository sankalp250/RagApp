import io
from typing import Tuple, Dict, Any
from pypdf import PdfReader
from backend.app.core.logging import logger


class TextExtractor:
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str, mime_type: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extracts plain text and basic metadata from file bytes.
        Supports: PDF, DOCX, TXT, Markdown, CSV.
        Returns: (extracted_text, metadata_dict)
        """
        filename_lower = filename.lower()
        metadata: Dict[str, Any] = {"filename": filename, "mime_type": mime_type}

        # ── PDF ──────────────────────────────────────────────────────────────
        if filename_lower.endswith(".pdf") or "pdf" in mime_type:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                num_pages = len(reader.pages)
                metadata["page_count"] = num_pages

                text_parts = []
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        text_parts.append(page_text.strip())
                extracted_text = "\n\n".join(text_parts)
                logger.info(f"Extracted {len(extracted_text)} chars from {num_pages} PDF pages: {filename}")
                return extracted_text, metadata
            except Exception as e:
                logger.error(f"Error extracting PDF text from {filename}: {e}")
                raise ValueError(f"Failed to parse PDF document: {str(e)}")

        # ── DOCX ─────────────────────────────────────────────────────────────
        if filename_lower.endswith(".docx") or "wordprocessingml" in mime_type or "msword" in mime_type:
            try:
                from docx import Document as DocxDocument  # type: ignore
                doc = DocxDocument(io.BytesIO(file_bytes))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                extracted_text = "\n\n".join(paragraphs)
                metadata["paragraph_count"] = len(paragraphs)
                logger.info(f"Extracted {len(extracted_text)} chars from DOCX: {filename}")
                return extracted_text, metadata
            except Exception as e:
                logger.error(f"Error extracting DOCX text from {filename}: {e}")
                raise ValueError(f"Failed to parse DOCX document: {str(e)}")

        # ── Plain text / Markdown / CSV / JSON ───────────────────────────────
        try:
            extracted_text = file_bytes.decode("utf-8", errors="replace").strip()
            metadata["character_count"] = len(extracted_text)
            return extracted_text, metadata
        except Exception as e:
            raise ValueError(f"Failed to decode text file: {str(e)}")

