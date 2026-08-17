import hashlib
import math
import re
from typing import List
from backend.app.ai.embeddings.base import EmbeddingProvider
from backend.app.core.config import settings


class LocalEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic TF/N-gram feature hashing embedding provider with unit L2 normalization.
    Produces robust 1536-dim vectors offline with semantic token overlap matching.
    """
    def __init__(self, dimension: int = 1536):
        self._dim = dimension or settings.EMBEDDING_DIMENSION

    @property
    def dimension(self) -> int:
        return self._dim

    def _embed_single_text(self, text: str) -> List[float]:
        vector = [0.0] * self._dim
        clean_text = text.lower().strip()
        tokens = re.findall(r'\b\w+\b', clean_text)
        
        if not tokens:
            return vector

        # Token 1-grams and 2-grams
        features = list(tokens)
        for i in range(len(tokens) - 1):
            features.append(f"{tokens[i]}_{tokens[i+1]}")

        for feat in features:
            h = int(hashlib.md5(feat.encode('utf-8')).hexdigest(), 16)
            idx = h % self._dim
            sign = 1.0 if ((h >> 8) & 1) == 1 else -1.0
            vector[idx] += sign

        # L2 normalize vector
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0.0:
            vector = [x / norm for x in vector]

        return vector

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_single_text(t) for t in texts]

    async def embed_query(self, query: str) -> List[float]:
        return self._embed_single_text(query)
