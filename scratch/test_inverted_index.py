import asyncio
import time
import re
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
import numpy as np

# Test pre-tokenized inverted index vs linear BM25
class FastBM25InvertedIndex:
    def __init__(self, chunks: List[str]):
        self.N = len(chunks)
        self.chunks = chunks
        self.avgdl = 0.0
        self.doc_lens = []
        self.df = defaultdict(int)
        # Inverted index: token -> list of (doc_idx, tf)
        self.postings = defaultdict(list)
        
        total_tokens = 0
        token_re = re.compile(r"\b[a-zA-Z0-9]{2,}\b")
        
        for idx, text in enumerate(chunks):
            tokens = token_re.findall(text.lower())
            doc_len = len(tokens)
            self.doc_lens.append(doc_len)
            total_tokens += doc_len
            
            tf_map = defaultdict(int)
            for tok in tokens:
                tf_map[tok] += 1
                
            for tok, count in tf_map.items():
                self.df[tok] += 1
                self.postings[tok].append((idx, count))
                
        self.avgdl = total_tokens / max(self.N, 1)
        
    def search(self, query_tokens: List[str], top_k: int = 10) -> List[Tuple[int, float]]:
        k1 = 1.5
        b = 0.75
        scores = defaultdict(float)
        
        for tok in query_tokens:
            posting_list = self.postings.get(tok)
            if not posting_list:
                continue
            df_t = self.df.get(tok, 0)
            idf = np.log((self.N - df_t + 0.5) / (df_t + 0.5) + 1.0)
            
            for doc_idx, tf in posting_list:
                doc_len = self.doc_lens[doc_idx]
                tf_norm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * doc_len / max(self.avgdl, 1)))
                scores[doc_idx] += idf * tf_norm
                
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]

# Benchmark with 10,000 synthetic chunks (simulating 5MB - 10MB document)
chunks = [
    f"Product {i}: TechStore wireless device {i} with high performance battery life and warranty details."
    for i in range(10000)
]
chunks[42] = "NovaPro Spatial Headphones priced at $299 with ultra low latency active noise cancellation."
chunks[108] = "ApexBook Pro M3 Max 16 inch Liquid Retina XDR laptop offering 36GB unified memory."

t0 = time.monotonic()
index = FastBM25InvertedIndex(chunks)
t_build = time.monotonic() - t0
print(f"Index built for 10,000 chunks in: {t_build*1000:.2f}ms")

query_tokens = ["novapro", "headphones", "products", "offer"]

# Test fast inverted search
t0 = time.monotonic()
for _ in range(100):
    results = index.search(query_tokens, top_k=5)
t_search = (time.monotonic() - t0) / 100
print(f"Inverted Index Search time: {t_search*1000:.3f}ms (Result: doc {results[0][0]}, score {results[0][1]:.3f})")
print(f"Found content: {chunks[results[0][0]]}")
