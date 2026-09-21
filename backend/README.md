# 🧠 AI Knowledge Intelligence Platform — Backend Engine

> High-performance, production-grade enterprise RAG (Retrieval-Augmented Generation) backend built with **FastAPI**, **Async SQLAlchemy**, **Supabase (pgvector)**, and multi-tier caching via **Upstash Redis** & L1 memory.

---

## 🌟 Key Capabilities

* **Hybrid Search Engine:** Combines in-memory inverted **Okapi BM25** sparse keyword retrieval with SIMD-vectorized **Dense Cosine Similarity** (Numpy BLAS dot product across 768-dim embeddings).
* **Reciprocal Rank Fusion (RRF):** Fuses lexical and semantic ranking without score distortion ($k=60$).
* **Sub-Millisecond TTFT Streaming:** Native Server-Sent Events (SSE) token streaming via Gemini 2.5 Flash / Groq LLM with circuit breaker failovers.
* **Autonomous Website Crawler:** Scrapes, cleans, and vectorizes public websites automatically via headless crawlers when the embed script is placed on any website.
* **Knowledge Gap Intelligence:** Analyzes customer queries in real-time, clusters semantic failure patterns using vector centroids, and generates 1-click documentation drafts.
* **Strict Multi-Tenant Isolation:** Guaranteed organizational and agent data isolation across all database queries and vector indexes.
* **Universal Embeddable JavaScript Widget:** Ships standalone Shadow DOM chat widget (`/widget.js`) compatible with any HTML, React, Next.js, Vue, or CMS site.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────┐
                                 │ Client / Embed Widget   │
                                 └────────────┬────────────┘
                                              │ HTTP / SSE
                                              ▼
                                 ┌─────────────────────────┐
                                 │   FastAPI Gateway API   │
                                 └────────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          ┌───────────────────────┐                       ┌───────────────────────┐
          │ L1 Memory / Redis L2  │                       │ Autonomous Crawler    │
          │ Semantic Response &   │                       │ & Ingestion Pipeline  │
          │ Agent Index Cache     │                       └───────────┬───────────┘
          └───────────┬───────────┘                                   │
                      ▼                                               │
          ┌───────────────────────┐                                   │
          │ Hybrid Retrieval      │                                   │
          │ • BM25 Inverted Index │                                   │
          │ • SIMD Dense Cosine   │◄──────────────────────────────────┘
          │ • RRF Fusion Gate     │
          └───────────┬───────────┘
                      ▼
          ┌───────────────────────┐
          │ LLM Generation Stream │
          │ • Primary: Gemini     │
          │ • Fallback: Groq      │
          └───────────┬───────────┘
                      ▼
          ┌───────────────────────┐
          │ Supabase (PostgreSQL) │
          │ • pgvector Embeddings │
          │ • Knowledge Gaps & QA │
          └───────────────────────┘
```

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── ai/                      # AI & Retrieval Engine
│   │   ├── embeddings/          # Multi-provider embeddings (Gemini, Local, OpenAI)
│   │   ├── rag_engine.py        # Hybrid BM25 + SIMD Dense search & RRF
│   │   ├── knowledge_gap.py     # Semantic gap clustering & article synthesis
│   │   └── evaluator.py         # Grounding & hallucination verification
│   ├── api/                     # API Routers & Dependencies
│   │   ├── v1/                  # Versioned API routes (Agents, Documents, Chat, Widget)
│   │   └── deps.py              # Auth & DB session dependency injection
│   ├── core/                    # Core Infrastructure
│   │   ├── config.py            # Pydantic v2 settings management
│   │   ├── cache.py             # Multi-tier L1 memory + Redis L2 caching
│   │   ├── circuit_breaker.py   # Resilient circuit breakers for external AI APIs
│   │   ├── rate_limit.py        # Token-bucket sliding window rate limiting
│   │   └── security.py          # JWT, password hashing, API key verification
│   ├── db/                      # Database Layer
│   │   ├── models/              # SQLAlchemy ORM models (Agent, Document, Message, etc.)
│   │   └── session.py           # Async session factory (Supabase PostgreSQL / asyncpg)
│   ├── domains/                 # Domain Business Logic
│   │   ├── chat/service.py      # Conversational flow, streaming & persistence
│   │   └── crawler/service.py   # Web crawling orchestrator & bootstrap engine
│   ├── schemas/                 # Pydantic validation schemas (DTOs)
│   ├── workers/                 # Async background workers & task queues
│   └── main.py                  # FastAPI application entrypoint & middleware
├── Dockerfile                   # Production container definition
├── .dockerignore
└── requirements.txt             # Locked production dependencies
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the project root with the following variables:

```ini
# Environment
PROJECT_NAME="AI Knowledge Intelligence Platform"
ENVIRONMENT="production"
DEBUG=False
API_V1_STR="/api/v1"

# Security
SECRET_KEY="generate-a-strong-random-secret-key-for-jwt"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALGORITHM="HS256"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_SUPABASE_ID.supabase.co:5432/postgres"
DATABASE_SYNC_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_SUPABASE_ID.supabase.co:5432/postgres"

# Redis Cache (Upstash or Local)
REDIS_URL="rediss://default:YOUR_TOKEN@YOUR_UPSTASH_HOST.upstash.io:6379"

# AI Providers
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
DEFAULT_LLM_PROVIDER="gemini"
FALLBACK_LLM_PROVIDER="groq"
GROQ_FALLBACK_MODEL="openai/gpt-oss-20b"
DEFAULT_EMBEDDING_PROVIDER="gemini"
EMBEDDING_DIMENSION=768

# CORS
CORS_ORIGINS="https://your-frontend-domain.com,http://localhost:3000"
```

---

## 🚀 Running Locally

### 1. Set Up Python Virtual Environment
```bash
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Launch FastAPI Server
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
* **Swagger API Documentation:** `http://localhost:8000/docs`
* **Widget Script Endpoint:** `http://localhost:8000/widget.js`
* **Health Check:** `http://localhost:8000/health`

---

## 🐳 Running with Docker

### Build and Run Standalone Container:
```bash
docker build -t rag-backend -f backend/Dockerfile .
docker run -d -p 8000:8000 --env-file .env --name rag_backend rag-backend
```

### Or using Root `docker-compose.yml`:
```bash
docker compose up -d backend
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Kubernetes / container liveness probe |
| `GET` | `/widget.js` | Serves client-side chat embed script |
| `GET` | `/api/v1/widget/{public_key}/config` | Public widget branding & settings |
| `POST` | `/api/v1/widget/bootstrap` | Idempotent website crawl & widget initialization |
| `POST` | `/api/v1/widget/{public_key}/chat` | Public chat endpoint (supports SSE streaming) |
| `POST` | `/api/v1/documents/upload` | Ingest PDF, TXT, DOCX knowledge files |
| `POST` | `/api/v1/crawler/sources` | Register a website for autonomous crawling |
| `GET` | `/api/v1/knowledge-gaps` | View detected unanswered questions & topics |
| `POST` | `/api/v1/knowledge-gaps/{id}/publish`| 1-click publish AI synthesized gap article |
