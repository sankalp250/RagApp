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
        """
        Embeds multiple texts using native batching.
        Reduces multiple round-trips to a single network call with L1 caching.
        """
        if not self.client:
            raise ValueError("Gemini API key is not configured.")
        if not texts:
            return []

        # Check L1 cache first for each text
        results: List[Optional[List[float]]] = [get_cached_embedding(t) for t in texts]
        missing_indices = [i for i, v in enumerate(results) if v is None]
        missing_texts = [texts[i] for i in missing_indices]

        if not missing_texts:
            return [r for r in results if r is not None]

        try:
            # Native Batch Request to Gemini API
            response = await self.client.aio.models.embed_content(
                model=self.model,
                contents=missing_texts
            )
            
            extracted_embeddings: List[List[float]] = []
            if hasattr(response, "embeddings") and response.embeddings:
                extracted_embeddings = [e.values for e in response.embeddings]
            elif hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                extracted_embeddings = [response.embedding.values]
            else:
                extracted_embeddings = getattr(response, "values", [])

            if len(extracted_embeddings) == len(missing_texts):
                for idx, text, emb in zip(missing_indices, missing_texts, extracted_embeddings):
                    results[idx] = emb
                    set_cached_embedding(text, emb)
                return [r for r in results if r is not None]
        except Exception as e:
            logger.warning(f"Native batch embed notice ({e}), falling back to concurrent thread execution")

        # Fallback to concurrent single embeddings if batch API signature differs
        async def _embed_fallback(t: str) -> List[float]:
            try:
                v = await asyncio.to_thread(self._sync_embed, t)
                set_cached_embedding(t, v)
                return v
            except Exception as e:
                from backend.app.ai.embeddings.local_provider import LocalEmbeddingProvider
                local_provider = LocalEmbeddingProvider(dimension=self._dim)
                return await local_provider.embed_query(t)

        fallback_res = await asyncio.gather(*[_embed_fallback(t) for t in missing_texts])
        for idx, emb in zip(missing_indices, fallback_res):
            results[idx] = emb
        return [r for r in results if r is not None]

    async def embed_query(self, query: str) -> List[float]:
        if not self.client:
            from backend.app.ai.embeddings.local_provider import LocalEmbeddingProvider
            local_provider = LocalEmbeddingProvider(dimension=self._dim)
            return await local_provider.embed_query(query)
        
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
            try:
                values = await asyncio.to_thread(self._sync_embed, query)
                set_cached_embedding(query, values)
                return values
            except Exception as e:
                from backend.app.ai.embeddings.local_provider import LocalEmbeddingProvider
                logger.warning(f"Gemini API embed_query failed ({e}), using local deterministic fallback")
                local_provider = LocalEmbeddingProvider(dimension=self._dim)
                return await local_provider.embed_query(query)

