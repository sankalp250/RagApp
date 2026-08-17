from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of texts into vectors."""
        pass

    @abstractmethod
    async def embed_query(self, query: str) -> List[float]:
        """Embeds a single search query."""
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Returns the embedding vector dimension."""
        pass
