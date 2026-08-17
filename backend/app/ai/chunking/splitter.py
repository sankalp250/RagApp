from typing import List, Dict, Any
import re


class RecursiveCharacterTextSplitter:
    def __init__(
        self,
        chunk_size: int = 600,
        chunk_overlap: int = 100,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def split_text(self, text: str) -> List[str]:
        """Recursively splits text into chunks of maximum chunk_size with overlap."""
        if not text:
            return []

        chunks = []
        # First split by main paragraph / newline separators
        raw_splits = self._split_by_separators(text, self.separators)
        
        current_chunk = ""
        for piece in raw_splits:
            if not piece.strip():
                continue
            if len(current_chunk) + len(piece) <= self.chunk_size:
                current_chunk += ("\n" if current_chunk else "") + piece
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # Handle overlap
                if self.chunk_overlap > 0 and current_chunk:
                    overlap_text = current_chunk[-self.chunk_overlap:]
                    current_chunk = overlap_text + "\n" + piece
                else:
                    current_chunk = piece

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _split_by_separators(self, text: str, separators: List[str]) -> List[str]:
        if not separators:
            return [text]
        sep = separators[0]
        if sep == "":
            return list(text)
        parts = text.split(sep)
        result = []
        for p in parts:
            if len(p) > self.chunk_size and len(separators) > 1:
                result.extend(self._split_by_separators(p, separators[1:]))
            elif p.strip():
                result.append(p)
        return result
