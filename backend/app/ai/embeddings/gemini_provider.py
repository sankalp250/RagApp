import asyncio
from typing import List, Optional
from backend.app.ai.embeddings.base import EmbeddingProvider
from backend.app.core.config import settings
from backend.app.core.cache import get_cached_embedding, set_cached_embedding
from backend.app.core.logging import logger

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None


class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-embedding-001"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        self._dim = 3072
        self.client = genai.Client(api_key=self.api_key) if genai and self.api_key else None

    @property
    def dimension(self) -> int:
        return self._dim

    def _sync_embed(self, text: str) -> List[float]:
        response = self.client.models.embed_content(
            model=self.model,
            contents=text
        )
        if hasattr(response, "embeddings") and response.embeddings:
            return response.embeddings[0].values
        elif hasattr(response, "embedding") and hasattr(response.embedding, "values"):
            return response.embedding.values
        return getattr(response, "values", [])

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
        
        async def _embed_single(text: str) -> List[float]:
            cached = get_cached_embedding(text)
            if cached:
                return cached
            try:
                response = await self.client.aio.models.embed_content(
                    model=self.model,
                    contents=text
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    vals = response.embeddings[0].values
                elif hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                    vals = response.embedding.values
                else:
                    vals = getattr(response, "values", [])
                set_cached_embedding(text, vals)
                return vals
            except Exception:
                vals = await asyncio.to_thread(self._sync_embed, text)
                set_cached_embedding(text, vals)
                return vals

        return await asyncio.gather(*[_embed_single(t) for t in texts])

    async def embed_query(self, query: str) -> List[float]:
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
        
        # Check L1 embedding cache (< 0.05ms)
        cached = get_cached_embedding(query)
        if cached:
            return cached
        
        try:
            response = await self.client.aio.models.embed_content(
                model=self.model,
                contents=query
            )
            if hasattr(response, "embeddings") and response.embeddings:
                values = response.embeddings[0].values
            elif hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                values = response.embedding.values
            else:
                values = getattr(response, "values", [])
            set_cached_embedding(query, values)
            return values
        except Exception:
            values = await asyncio.to_thread(self._sync_embed, query)
            set_cached_embedding(query, values)
            return values

