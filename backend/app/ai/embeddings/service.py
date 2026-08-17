from typing import Optional
from backend.app.ai.embeddings.base import EmbeddingProvider
from backend.app.ai.embeddings.local_provider import LocalEmbeddingProvider
from backend.app.ai.embeddings.gemini_provider import GeminiEmbeddingProvider
from backend.app.ai.embeddings.openai_provider import OpenAIEmbeddingProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger


class EmbeddingService:
    _instance: Optional[EmbeddingProvider] = None

    @classmethod
    def get_provider(cls, provider_name: Optional[str] = None) -> EmbeddingProvider:
        target = (provider_name or settings.DEFAULT_EMBEDDING_PROVIDER).lower()

        if target == "openai" and settings.OPENAI_API_KEY:
            try:
                return OpenAIEmbeddingProvider()
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI embeddings, falling back to local: {e}")
        elif target == "gemini" and settings.GEMINI_API_KEY:
            try:
                return GeminiEmbeddingProvider()
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini embeddings, falling back to local: {e}")

        # Default reliable offline / local provider
        return LocalEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
