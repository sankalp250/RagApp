# 🧠 AI Knowledge Intelligence Platform (RagApp)

<p align="center">
  <strong>Production-Grade Multi-Tenant AI Agent & RAG Platform with Autonomous Web Crawling, Universal Embeddable Widget, and Continuous Knowledge Gap Intelligence.</strong>
</p>

<p align="center">
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/Python-3.11%2B-3776AB.svg?style=flat&logo=python&logoColor=white" alt="Python 3.11+" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.3-black.svg?style=flat&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791.svg?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL with pgvector" /></a>
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-7-DC382D.svg?style=flat&logo=redis&logoColor=white" alt="Redis 7" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4.svg?style=flat&logo=google&logoColor=white" alt="Gemini" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-Fallback_Inference-F55036.svg?style=flat" alt="Groq" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat" alt="License: MIT" /></a>
</p>

---

## 🌐 Live Deployments

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Production Dashboard** | Vercel | [rag-app-lovat-six.vercel.app](https://rag-app-lovat-six.vercel.app/) | ![Ready](https://img.shields.io/badge/Status-Ready-brightgreen.svg) |
| **Alternative Preview Domain** | Vercel | [rag-mu8kckpwx-sankalp-singhs-projects-08580eee.vercel.app](https://rag-mu8kckpwx-sankalp-singhs-projects-08580eee.vercel.app/) | ![Ready](https://img.shields.io/badge/Status-Ready-brightgreen.svg) |
| **Backend API Gateway** | Render.com | [ragapp-backend.onrender.com](https://ragapp-backend.onrender.com) | ![Healthy](https://img.shields.io/badge/Status-Healthy-brightgreen.svg) |
| **Interactive API Documentation** | Swagger / OpenAPI | [ragapp-backend.onrender.com/docs](https://ragapp-backend.onrender.com/docs) | ![Swagger](https://img.shields.io/badge/Swagger-UI-blue.svg) |
| **Universal Chat Widget CDN** | Direct Asset | [ragapp-backend.onrender.com/widget.js](https://ragapp-backend.onrender.com/widget.js) | ![Live](https://img.shields.io/badge/Asset-Live-blue.svg) |

---

## 📌 Executive Summary

Traditional Retrieval-Augmented Generation (RAG) platforms suffer from a fundamental blindspot: **they only know how to retrieve answers from documents you remember to give them—they have no idea what they do NOT know.** When visitors ask unaddressed questions, typical chatbots either hallucinate or reply with generic apologies, leaving organizations completely unaware of critical blind spots in their documentation, product guides, and policies.

**RagApp** is an enterprise-grade AI Agent Infrastructure and Knowledge Intelligence SaaS platform. It enables organizations to ingest documents or autonomously crawl public websites, provision custom-branded AI agents, embed an ultra-lightweight streaming chat widget onto any website with a single `<script>` tag, and **continuously identify Knowledge Gaps in real time**.

```
Customer Website (Widget) ──► FastAPI Gateway ──► Hybrid RAG (SIMD pgvector + BM25)
                                    │
                                    ▼
                      Knowledge Gap Detection Engine
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
    Actionable Gap Clustering              Automated Content Fixes
    (Unanswered Questions)                 (Auto-generated Docs / Recommendations)
```

---

## 🌟 Key Features & Architectural Highlights

### 1. 🔍 Flagship Knowledge Gap Detection Engine
* **Tri-Signal Anomaly Detection**: Analyzes every conversation turn for (1) low retrieval similarity scores, (2) empty vector context windows, and (3) linguistic markers of model-admitted ignorance ("I don't know", "Not mentioned in documents").
* **Topic Clustering & Severity Scoring**: Groups related knowledge deficits using HDBSCAN / cosine clustering, scoring gaps based on recurrence frequency and customer impact.
* **Autonomous Documentation Synthesis**: Uses Gemini / Groq to automatically generate draft documentation and suggested articles to resolve identified gaps.
* **Full Gap Lifecycle**: Native triage workflow (`OPEN` ➔ `REVIEWED` ➔ `RESOLVED`) directly inside the analytics dashboard.

### 2. ⚡ High-Performance Hybrid RAG Pipeline
* **Dual-Retrieval Fusion**: Combines dense vector semantic search (Google GenAI 768-dim embeddings via `pgvector`) with sparse BM25 lexical keyword matching using Reciprocal Rank Fusion (RRF).
* **SIMD-Accelerated Vector Indexing**: Sub-millisecond in-memory agent vector index caching (L1) with NumPy SIMD vector dot products.
* **Dynamic Context Grounding & Citations**: Automatically formats retrieved chunks with source document metadata, page numbers, and cosine similarity scores.
* **Server-Sent Events (SSE) Streaming**: Low-latency token-by-token streaming back to the client widget.
* **Multi-Provider Resiliency**: Primary execution with **Google Gemini 2.5 Flash**, accompanied by an automatic circuit breaker fallback to **Groq (`openai/gpt-oss-20b`)** upon rate limits or upstream timeouts.

### 3. 🕷️ Autonomous Production Web Crawler
* **Hybrid Crawler Core**: Asynchronous high-concurrency scraping using `httpx` + `BeautifulSoup4` for static content, with automated dynamic fallback to headless **Playwright** for client-rendered Single-Page Applications (React, Angular, Vue).
* **Enterprise Scraping Guardrails**: Configurable page budget limits, maximum recursion depth controls, same-origin domain restrictions, robots.txt compliance, and rate-limiting delays.
* **Intelligent Document Cleaners**: Automatically eliminates boilerplate headers, footers, navigation trees, cookie banners, and scripts, distilling pure Markdown for vectorization.
* **Incremental Re-Crawling**: Background job scheduler detects modified pages via content hashing, updating embeddings without rebuilding the entire corpus.

### 4. 💬 Universal Embeddable Chat Widget (`widget.js`)
* **Framework Agnostic**: Zero external dependencies, pure vanilla JavaScript bundle (<25 KB gzipped).
* **Drop-in Simplicity**: Embed with a single `<script>` tag into **Plain HTML, React, Next.js, Vue, Shopify, WordPress, and Webflow**.
* **Real-Time Streaming**: Native Server-Sent Events (SSE) support for responsive token streaming.
* **White-Label Customization**: Custom primary colors, avatar icons, widget titles, welcome greetings, and dynamic suggested questions configured per agent.
* **Anonymous Visitor Session Handling**: Cookie/localStorage-backed visitor identity tracking, multi-turn conversation memory, and thumbs-up/down feedback collection.

### 5. 🏢 Multi-Tenant Architecture & Data Isolation
* **Hierarchical Isolation**: Strict multi-tenancy model: `Organization` ➔ `Agent` ➔ `Documents` / `Knowledge Gaps` / `Conversations`.
* **Public Key Security**: Public-facing chat endpoints operate exclusively on unprivileged agent `public_key` tokens, completely decoupling public chat traffic from administrative management APIs.
* **Role-Based Access Control (RBAC)**: Supports organization owners, admins, and members with granular permission scopes.

### 6. 📊 Modern Executive Intelligence Dashboard
* **Cutting-Edge Tech Stack**: Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, and **Framer Motion**.
* **Instant Client Navigation**: Client-side SWR caching (25s TTL) with concurrent in-flight request deduplication for 0ms tab transitions across Overview, Chatbots, Knowledge Base, and Knowledge Gaps.
* **Zero-Flicker Skeleton UX**: Eliminated false empty state layout jumps with context-aware shimmering skeleton loaders.
* **Mission Control Center**: Real-time KPI cards for Resolution Rate, Average Response Latency, Active Chatbots, Knowledge Health Score, and Total Processed Chunks.
* **Conversation Explorer**: Comprehensive audit log with turn-by-turn retrieval inspection, retrieved chunk evidence, user sentiment, and feedback scores.
* **Knowledge Studio**: Upload documents (PDF, DOCX, TXT, CSV, MD), trigger URL crawls, and inspect chunked vectors.
* **Live Agent Customizer**: Interactive preview pane to customize colors, greetings, and system instructions in real time.

### 7. 🛡️ Enterprise Hardening & Production Observability
* **High-Throughput L1 In-Memory Analytics Cache**: Shields PostgreSQL/Supabase connection limits from query stampedes on heavy analytics subqueries.
* **Redis Token-Bucket Rate Limiter**: Distributed sliding window rate limiting per IP and per tenant with automatic in-memory fallback.
* **Circuit Breaker Pattern**: Wraps external LLM and embedding APIs to avert cascading thread pool exhaustion during third-party outages.
* **Structured Observability**: Structured JSON logging, unique request correlation IDs (`X-Request-ID`), and microsecond execution latency metrics via ASGI middleware.
* **Multi-Tier Caching**: Redis semantic cache for frequent query responses + L1 agent & analytics memory cache for sub-millisecond responses.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & Ingestion Layer"]
        UserBrowser["Visitor / Customer Website"]
        WidgetScript["Embedded widget.js"]
        AdminDashboard["Next.js 16 Web Dashboard"]
        DocUploader["File Uploader (PDF / DOCX / TXT / CSV)"]
        WebCrawler["Autonomous Web Crawler (Playwright + httpx)"]
    end

    subgraph APILayer ["FastAPI Application Gateway (:8000)"]
        CorsRateLimit["CORS & Token-Bucket Rate Limiter"]
        Observability["Observability Middleware (Latency & Request-ID)"]
        AuthRouter["Auth & Tenant RBAC Service"]
        AgentRouter["Agent Management API"]
        WidgetAPI["Public Widget Chat & SSE API"]
        AnalyticsAPI["Knowledge Analytics & Gap API"]
    end

    subgraph CoreAIEngine ["AI & Retrieval-Augmented Generation Engine"]
        L1Cache["L1 In-Memory Agent & Index Cache"]
        RAGRouter["Hybrid RAG Router"]
        SIMDVector["SIMD Vector Cosine Search (pgvector)"]
        BM25Index["BM25 Lexical Keyword Search"]
        RRF["Reciprocal Rank Fusion (RRF)"]
        GeminiLLM["Primary LLM: Google Gemini 2.5 Flash"]
        GroqLLM["Fallback LLM: Groq (gpt-oss-20b)"]
        CircuitBreaker["Circuit Breaker & Fallback Controller"]
    end

    subgraph GapDetection ["Knowledge Intelligence Loop"]
        GapAnalyzer["3-Signal Gap Analyzer"]
        GapScorer["Recurrence & Severity Scorer"]
        DocSynthesizer["AI Documentation Recommendation Generator"]
    end

    subgraph DataStorage ["Data & Caching Layer"]
        PostgresDB[("PostgreSQL 16 + pgvector")]
        RedisStore[("Redis 7 (Cache, Queue, Rate Limits)")]
        LocalStore[("Storage (Local Disk / S3 Hook)")]
    end

    UserBrowser -->|Loads| WidgetScript
    WidgetScript -->|SSE Stream / JSON| CorsRateLimit
    AdminDashboard -->|REST API / JWT| CorsRateLimit
    DocUploader -->|Uploads| AgentRouter
    WebCrawler -->|Extracts HTML| AgentRouter

    CorsRateLimit --> Observability
    Observability --> AuthRouter
    Observability --> WidgetAPI
    Observability --> AnalyticsAPI

    WidgetAPI --> RAGRouter
    RAGRouter --> L1Cache
    RAGRouter --> SIMDVector
    RAGRouter --> BM25Index
    SIMDVector --> RRF
    BM25Index --> RRF
    RRF --> CircuitBreaker
    CircuitBreaker --> GeminiLLM
    CircuitBreaker -.->|On Failure| GroqLLM

    GeminiLLM --> GapAnalyzer
    GapAnalyzer --> GapScorer
    GapScorer --> DocSynthesizer
    DocSynthesizer --> PostgresDB

    SIMDVector <--> PostgresDB
    CorsRateLimit <--> RedisStore
    AgentRouter --> LocalStore
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) 0.115, [Uvicorn](https://www.uvicorn.org/), [Pydantic v2](https://docs.pydantic.dev/), [Pydantic-Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) |
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16 (App Router), [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5 |
| **Styling & Animation** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector), [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org/), [Alembic](https://alembic.sqlalchemy.org/) |
| **Cache & Message Broker** | [Redis 7](https://redis.io/) (Sliding window rate-limiter, L2 semantic caching, background queue) |
| **Primary AI & LLMs** | [Google Gemini 2.5 Flash](https://ai.google.dev/) (`google-genai` SDK), Google Text-Embedding-004 (768-dim) |
| **Secondary / Fallback LLMs** | [Groq](https://groq.com/) Cloud Inference Engine (`openai/gpt-oss-20b`), OpenAI API integration |
| **Web Crawling & Parsing** | [Playwright](https://playwright.dev/) (Headless Chromium), [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/), [HTTPX](https://www.python-httpx.org/), [lxml](https://lxml.de/) |
| **Document Processing** | [PyPDF](https://pypdf.readthedocs.io/), [python-docx](https://python-docx.readthedocs.io/), semantic text chunking algorithms |
| **Embed Widget** | Standalone Vanilla JavaScript (`widget.js`), SSE streaming client, zero dependencies |
| **Containerization** | Docker, Docker Compose |

---

## 📂 Repository Structure

```plaintext
RagArchitecture/
├── backend/                         # FastAPI Backend Application
│   ├── app/
│   │   ├── ai/                      # AI, RAG & Intelligence Core
│   │   │   ├── chunking/            # Document chunking & tokenization algorithms
│   │   │   ├── embeddings/          # Multi-provider embedding abstractions (Gemini, OpenAI)
│   │   │   ├── evaluator.py         # Response grounding & quality evaluator
│   │   │   ├── intelligence.py      # Analytics & knowledge health scoring algorithms
│   │   │   ├── knowledge_gap.py     # 3-signal Knowledge Gap Detection Engine
│   │   │   └── rag_engine.py        # High-performance hybrid RAG router (SIMD + BM25)
│   │   ├── api/                     # REST API Routing Layer
│   │   │   ├── deps.py              # Dependency injection (DB session, Auth, Tenant context)
│   │   │   ├── router.py            # Master API router registry
│   │   │   └── v1/                  # Version 1 API endpoints
│   │   │       ├── agents.py        # Agent lifecycle & configuration management
│   │   │       ├── analytics.py     # Analytics, KPI metrics & Knowledge Gap reports
│   │   │       ├── auth.py          # User registration, login & JWT tokens
│   │   │       ├── chat.py          # Authenticated administrative chat sessions
│   │   │       ├── documents.py     # File upload, parsing & vector indexing
│   │   │       ├── knowledge.py     # Autonomous web crawler job triggering & status
│   │   │       ├── organizations.py # Multi-tenant organization CRUD
│   │   │       ├── telemetry.py     # Real-time event telemetry
│   │   │       └── widget.py        # Public widget API & Server-Sent Events (SSE)
│   │   ├── core/                    # Core Infrastructure Utilities
│   │   │   ├── cache.py             # Redis caching service with L1 fallback
│   │   │   ├── circuit_breaker.py   # Circuit breaker pattern for external LLM calls
│   │   │   ├── config.py            # Pydantic environment configuration settings
│   │   │   ├── exceptions.py        # Domain exception hierarchy
│   │   │   ├── logging.py           # Structured JSON logger
│   │   │   ├── observability.py     # ASGI latency & request-tracing middleware
│   │   │   └── rate_limit.py        # Token-bucket sliding window rate limiter
│   │   ├── db/                      # Database Layer
│   │   │   ├── base.py              # SQLAlchemy declarative base
│   │   │   ├── models/              # Declarative ORM models (Agent, User, Org, Doc, Gap, etc.)
│   │   │   └── session.py           # Asyncpg connection pooling & engine initialization
│   │   ├── domains/                 # Domain Services (Business logic separation)
│   │   ├── schemas/                 # Pydantic Request & Response Data Transfer Objects
│   │   ├── workers/                 # Async Background Worker Pipelines
│   │   │   ├── crawler_jobs.py      # Background Playwright / BeautifulSoup crawler jobs
│   │   │   ├── document_jobs.py     # Background document extraction & vectorization
│   │   │   ├── evaluation_jobs.py   # Post-chat evaluation & quality audit jobs
│   │   │   └── queue.py             # Redis-backed job queuing system
│   │   └── main.py                  # Application entrypoint & lifespan pre-warm orchestrator
│   ├── storage/                     # Local file upload staging area
│   └── tests/                       # Pytest test suites (Unit, Integration, Hardening)
├── frontend/                        # Next.js 16 + React 19 Web Dashboard
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── dashboard/           # Authenticated Dashboard Pages
│   │   │   │   ├── analytics/       # Advanced RAG analytics & latency graphs
│   │   │   │   ├── chatbots/        # Bot creation, customization & prompt tuning
│   │   │   │   ├── conversations/   # Conversation log explorer & retrieval evidence
│   │   │   │   ├── integrations/    # Snippet generator (HTML, React, Next, Shopify)
│   │   │   │   ├── knowledge-base/  # Document upload & web crawling manager
│   │   │   │   ├── knowledge-gaps/  # Knowledge Gap radar, triage & AI draft fixes
│   │   │   │   ├── settings/        # Organization settings & API keys
│   │   │   │   └── page.tsx         # Dashboard overview with health score & KPIs
│   │   │   ├── login/               # Authentication page
│   │   │   ├── register/            # User onboarding & organization setup
│   │   │   ├── globals.css          # Tailwind CSS v4 design tokens
│   │   │   ├── layout.tsx           # Root application layout
│   │   │   └── page.tsx             # Marketing landing page & interactive feature tour
│   │   ├── components/              # Modular UI components (Navbar, Hero, Gauges, Cards)
│   │   ├── lib/                     # API client wrapper, Auth context & utility functions
│   │   └── types/                   # TypeScript interfaces & DTO definitions
│   └── package.json                 # Frontend dependencies & scripts
├── docs/                            # In-depth architectural & integration documentation
│   └── EMBED_INTEGRATION_GUIDE.md   # Universal embed guide (HTML, React, Next.js, Shopify)
├── img/                             # Screenshots, architectural visuals & recordings
├── scripts/                         # Database migration & seed utilities
├── docker-compose.yml               # Local infrastructure (PostgreSQL pgvector, Redis, Adminer)
├── pyproject.toml                   # Python dependencies & build configurations
├── requirements.txt                 # Pinned Python package requirements
├── widget.js                        # Compiled standalone embeddable chat widget script (<25KB)
├── index.html                       # Local sandbox testing page for the embedded widget
├── .env.example                     # Environment template configuration
└── README.md                        # Master Project Documentation
```

---

## 🚀 Quick Start Guide

Follow these steps to spin up the complete end-to-end platform locally.

### Prerequisites
* **Docker & Docker Compose** (for PostgreSQL + pgvector and Redis)
* **Python 3.11+**
* **Node.js 18+** & **npm**
* An API key for **Google Gemini** ([Google AI Studio](https://aistudio.google.com/)) or **Groq** ([Groq Console](https://console.groq.com/))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/sankalp250/RagApp.git
cd RagApp
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Edit `.env` and supply your API credentials:
```env
# Database & Cache
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/rag_intelligence"
DATABASE_SYNC_URL="postgresql://postgres:postgres@localhost:5432/rag_intelligence"
REDIS_URL="redis://localhost:6379/0"

# AI Providers
GEMINI_API_KEY="your-gemini-api-key-here"
DEFAULT_LLM_PROVIDER="gemini"
DEFAULT_EMBEDDING_PROVIDER="gemini"

# Optional Fallback Provider
GROQ_API_KEY="your-groq-api-key-here"
FALLBACK_LLM_PROVIDER="groq"

# Security
SECRET_KEY="your-super-secret-key-change-in-production"
```

---

### Step 3: Start Infrastructure Services (PostgreSQL & Redis)
Launch PostgreSQL (with `pgvector` extension enabled) and Redis using Docker Compose:
```bash
docker-compose up -d
```
> [!NOTE]
> This starts PostgreSQL on port `5432`, Redis on port `6379`, and the Adminer database management UI on port `8080`.

---

### Step 4: Setup & Launch the Backend Server

1. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   # Install Playwright browser binaries for website crawling:
   playwright install chromium
   ```

3. **Start the FastAPI backend server:**
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Verify Backend Health:**
   Open [http://localhost:8000/health](http://localhost:8000/health) or explore interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Step 5: Setup & Launch the Next.js Frontend Dashboard

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node packages:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```

4. **Access the Dashboard:**
   Open your browser to [http://localhost:3000](http://localhost:3000) to create your admin account, configure your first agent, and upload knowledge documents.

---

### Step 6: Test the Embedded Widget Sandbox
The repository includes a ready-to-test client website sandbox:
1. Open [http://localhost:8000/](http://localhost:8000/) or [http://localhost:8000/demo](http://localhost:8000/demo) directly in your browser.
2. The standalone `widget.js` script will automatically initialize against the local backend server, demonstrating real-time streaming, suggestions, and feedback collection.

---

## 💻 Universal Widget Integration Guide

Deploy the AI chat widget onto any web application in under 60 seconds.

### 1. Plain HTML / Static Websites
Add this snippet directly before the closing `</body>` tag:
```html
<script
  src="http://localhost:8000/widget.js"
  data-agent-id="YOUR_AGENT_PUBLIC_KEY"
  data-api-url="http://localhost:8000"
  data-position="bottom-right"
  async>
</script>
```

### 2. React / Next.js Component
```tsx
import { useEffect } from "react";

export function ChatWidget({ agentPublicKey }: { agentPublicKey: string }) {
  useEffect(() => {
    if (document.getElementById("rag-widget-script")) return;

    const script = document.createElement("script");
    script.id = "rag-widget-script";
    script.src = "https://your-api-domain.com/widget.js";
    script.async = true;
    script.setAttribute("data-agent-id", agentPublicKey);
    script.setAttribute("data-api-url", "https://your-api-domain.com");
    script.setAttribute("data-position", "bottom-right");
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("rag-widget-script");
      if (el) el.remove();
    };
  }, [agentPublicKey]);

  return null;
}
```

### 3. Shopify Integration
Paste the snippet inside `layout/theme.liquid` right before `</body>`:
```liquid
<!-- RagApp AI Support Widget -->
<script
  src="https://your-api-domain.com/widget.js"
  data-agent-id="{{ settings.rag_agent_public_key }}"
  data-api-url="https://your-api-domain.com"
  async>
</script>
```

### Supported Configuration Attributes

| Attribute | Required | Description | Default |
|---|---|---|---|
| `data-agent-id` | **Yes** | The unique Public Key or ID of your AI Agent | — |
| `data-api-url` | No | Base URL of the running FastAPI backend | `http://127.0.0.1:8000` |
| `data-position` | No | Widget position on screen (`bottom-right` or `bottom-left`) | `bottom-right` |
| `data-primary-color` | No | Override brand hex color (e.g. `#6366f1`) | Loaded from Agent Config |
| `data-title` | No | Override header title of the widget | Loaded from Agent Config |
| `data-greeting` | No | Override initial greeting message | Loaded from Agent Config |

---

## 📡 Key API Endpoints Reference

The platform provides a comprehensive OpenAPI v3 REST specification available at `/docs`.

### Authentication & Tenant Management
* `POST /api/v1/auth/register` — Register a new organization and admin account.
* `POST /api/v1/auth/login` — Authenticate and receive JWT access token.
* `GET  /api/v1/auth/me` — Retrieve current user profile and organization memberships.

### AI Agents & Configurations
* `GET  /api/v1/agents` — List all agents belonging to the current organization.
* `POST /api/v1/agents` — Create an agent (name, system prompt, temperature, model).
* `GET  /api/v1/agents/{id}` — Retrieve full agent metadata and public key.
* `PUT  /api/v1/agents/{id}` — Update agent personality, model parameters, or appearance.

### Knowledge Base & Web Ingestion
* `POST /api/v1/documents/upload` — Upload documents (PDF, DOCX, TXT, CSV, MD).
* `GET  /api/v1/documents` — List uploaded documents and indexing statuses.
* `POST /api/knowledge/crawl` — Trigger autonomous website crawler for a target domain.
* `GET  /api/knowledge/crawl/{job_id}` — Check status, crawled pages, and chunk counts.

### Public Widget (No Authentication Required)
* `GET  /api/v1/widget/{public_key}/config` — Fetch public widget UI settings.
* `POST /api/v1/widget/{public_key}/chat` — Execute chat completions (supports SSE streaming).
* `POST /api/v1/widget/{public_key}/feedback` — Submit visitor rating (thumbs up/down).

### Knowledge Intelligence & Analytics
* `GET  /api/v1/analytics/overview` — High-level KPI metrics (resolution rate, latency, health score).
* `GET  /api/v1/analytics/knowledge-gaps` — Retrieve detected knowledge gaps with clustering.
* `POST /api/v1/analytics/knowledge-gaps/{id}/recommend` — Generate AI documentation draft for a gap.
* `PATCH /api/v1/analytics/knowledge-gaps/{id}` — Update gap status (`OPEN`, `REVIEWED`, `RESOLVED`).

---

## 🧪 Testing & Quality Assurance

The platform is backed by a comprehensive asynchronous test suite built with `pytest`:

```bash
# Run all unit and integration tests
pytest backend/tests

# Run Phase 1 Foundation tests
pytest backend/tests/unit/test_phase1.py

# Run Phase 6 Evaluation Engine tests
pytest backend/tests/unit/test_phase6_evaluation.py

# Run Phase 7 Knowledge Intelligence tests
pytest backend/tests/unit/test_phase7_intelligence.py

# Run Phase 8 Hardening, Cache & Rate Limiting tests
pytest backend/tests/unit/test_phase8_hardening.py
```

---

## ⚙️ Key Environment Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `PROJECT_NAME` | String | `AI Knowledge Intelligence Platform` | System name displayed in logs & OpenAPI |
| `ENVIRONMENT` | String | `development` | Deployment environment (`development` / `production`) |
| `DATABASE_URL` | String | `postgresql+asyncpg://...` | Asynchronous PostgreSQL connection string |
| `REDIS_URL` | String | `redis://localhost:6379/0` | Redis connection string for cache and rate limits |
| `GEMINI_API_KEY` | String | `""` | Google Gemini API key |
| `GROQ_API_KEY` | String | `""` | Groq inference API key (for fallback) |
| `DEFAULT_LLM_PROVIDER`| String | `gemini` | Primary LLM provider (`gemini` or `groq`) |
| `FALLBACK_LLM_PROVIDER`| String | `groq` | Automatic fallback provider when primary fails |
| `STORAGE_BACKEND` | String | `local` | Document storage engine (`local` or `s3`) |
| `PLAYWRIGHT_ENABLED` | Boolean| `True` | Enable headless Playwright for JS-heavy sites |
| `CRAWLER_MAX_CONCURRENT_REQUESTS` | Integer | `5` | Concurrency limit for the website crawler |

---

## 🗺️ Roadmap & Future Horizons

- [x] Multi-tenant Organization & Agent Infrastructure
- [x] Asynchronous Document Parsing & Semantic Chunking Engine
- [x] Hybrid RAG Pipeline with pgvector & BM25 Reciprocal Rank Fusion
- [x] Tri-Signal Knowledge Gap Detection Engine
- [x] Embeddable, zero-dependency streaming widget (`widget.js`)
- [x] Next.js 16 + React 19 Executive Analytics Dashboard
- [x] Autonomous Website Crawler (Playwright + BeautifulSoup)
- [x] Redis semantic caching, circuit breakers, and rate limiters
- [ ] Multi-Modal RAG (charts, images, diagrams in enterprise PDFs)
- [ ] Direct bi-directional integrations with Zendesk, Intercom, and Freshdesk
- [ ] Slack & Discord bot connectors for internal company knowledge bases
- [ ] Voice-enabled conversational widget streaming

---

## 🤝 Contributing

Contributions are warmly welcomed! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for modern businesses that want accurate, transparent, and self-healing AI agents.
</p>
