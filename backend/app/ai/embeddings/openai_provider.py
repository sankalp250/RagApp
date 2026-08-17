from typing import List, Optional
from backend.app.ai.embeddings.base import EmbeddingProvider
from backend.app.core.config import settings

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-3-small"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        self._dim = 1536
        self.client = AsyncOpenAI(api_key=self.api_key) if AsyncOpenAI and self.api_key else None

    @property
    def dimension(self) -> int:
        return self._dim

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            raise ValueError("OpenAI API key is not configured.")
        response = await self.client.embeddings.create(
            input=texts,
            model=self.model
        )
        return [data.embedding for data in response.data]

    async def embed_query(self, query: str) -> List[float]:
        if not self.client:
            raise ValueError("OpenAI API key is not configured.")
        response = await self.client.embeddings.create(
            input=[query],
            model=self.model
        )
        return response.data[0].embedding
