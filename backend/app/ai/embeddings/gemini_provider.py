from typing import List, Optional
from backend.app.ai.embeddings.base import EmbeddingProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None


class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-004"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        self._dim = 768
        self.client = genai.Client(api_key=self.api_key) if genai and self.api_key else None

    @property
    def dimension(self) -> int:
        return self._dim

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
        results = []
        for text in texts:
            response = self.client.models.embed_content(
                model=self.model,
                contents=text
            )
            results.append(response.embedding.values)
        return results

    async def embed_query(self, query: str) -> List[float]:
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
        response = self.client.models.embed_content(
            model=self.model,
            contents=query
        )
        return response.embedding.values
