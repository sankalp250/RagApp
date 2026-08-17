AI Knowledge Intelligence Platform

Production-oriented multi-tenant AI agent + RAG platform with Knowledge Gap Detection

Businesses upload their knowledge, configure an AI support agent, embed it into their website, and receive actionable intelligence about what their AI is unable to answer reliably.

1. Project Overview

This project is a multi-tenant AI Agent Infrastructure platform for companies that want an AI chatbot on their website without building the entire AI backend themselves.

A company can:

Create an organization.

Create one or more AI agents.

Upload company documents such as FAQs, product manuals, policies, warranty documents, shipping information, internal knowledge, etc.

Let the platform process and index those documents.

Configure the agent's personality, model, instructions, and behavior.

Embed the chatbot into its website using a small JavaScript snippet.

Allow customers to communicate with the chatbot.

Monitor conversations, latency, usage, and answer quality.

Automatically detect Knowledge Gaps where the company's knowledge base is insufficient.

View grouped knowledge gaps and recommendations in the dashboard.

Improve the knowledge base and observe whether the gap gets resolved over time.

The platform is therefore not just a RAG chatbot.

It is a RAG + AI Agent + Knowledge Intelligence platform.

2. One-Sentence Product Definition

A SaaS platform that lets businesses deploy production-grade AI support agents through an embeddable widget while continuously identifying where their knowledge base is failing and what information should be added.

3. The Core Problem

A traditional company usually needs to build or integrate:

Chat UI

Authentication

Document upload

Document processing

Chunking

Embeddings

Vector search

RAG pipeline

LLM integration

Conversation memory

Rate limiting

Caching

Usage monitoring

Analytics

Security

Background jobs

Scaling infrastructure

Failure handling

Observability

Most companies do not want to build all of this themselves.

Even after they deploy a RAG chatbot, there is another major problem:

How does the company know what its chatbot does not know?

A normal RAG platform generally focuses on retrieving documents and generating an answer.

Our platform goes one step further:

It analyzes production conversations and identifies where the knowledge base is insufficient.

4. What Makes This Project Unique?

The Main Differentiator: Knowledge Gap Detection

Most RAG chatbot platforms can be summarized as:

Upload Documents
      ↓
Create Embeddings
      ↓
Vector Search
      ↓
LLM
      ↓
Chatbot

Our platform adds a continuous intelligence loop:

Chat
  ↓
RAG Retrieval
  ↓
Agent / LLM Response
  ↓
Response Evaluation
  ↓
Failure / Low-Grounding / Low-Relevance Detection
  ↓
Semantic Grouping of Similar Failures
  ↓
Knowledge Gap Detection
  ↓
Business Recommendation
  ↓
Dashboard
  ↓
Company Improves Knowledge Base
  ↓
RAG System Improves

Example

User asks:

"Can I change my delivery address after the order is shipped?"

The bot cannot find strong supporting information.

Instead of silently failing, our system records this as evidence of a possible knowledge gap.

After many similar conversations, the dashboard may show:

⚠ Knowledge Gap Detected

Topic:
Delivery Address Changes After Shipment

Occurrences:
143

Successful Answers:
32%

Average Retrieval Relevance:
Low

User Dissatisfaction:
High

Recommendation:
Add explicit documentation covering address changes
after order dispatch/shipment.

This means the product is not just answering customers.

It is also answering the question:

"What should the company teach its AI next?"

5. How This Differs From Other RAG Chatbots

Typical RAG Chatbot

This Platform

Upload documents

Upload documents

Build embeddings

Build embeddings

Retrieve relevant chunks

Retrieve relevant chunks

Generate response

Generate response

Show chat UI

Show embeddable chat UI

Basic conversation history

Production conversation history

Basic analytics

Detailed AI/usage analytics

Usually stops at answer generation

Evaluates answer quality

Logs failed conversations

Detects repeated knowledge gaps

Treats failures individually

Groups semantically similar failures

Tells company what happened

Tells company what knowledge is missing

Static knowledge base

Continuous knowledge improvement loop

Interview-ready answer

If an interviewer asks:

"What is unique about your project?"

Answer:

"Most RAG platforms stop after retrieving documents and generating an answer. Our system adds a Knowledge Intelligence layer. It continuously analyzes real customer conversations, evaluates whether answers were well supported, detects repeated low-quality or unanswered queries, semantically groups those queries into topics, and surfaces knowledge gaps in the company's dashboard. So instead of only giving a company an AI chatbot, we tell the company where its knowledge base is failing and what information it should add."

Shorter version

"Our differentiator is the feedback loop: the chatbot does not just answer customers; it learns from production failures by identifying recurring knowledge gaps and turning them into actionable documentation recommendations."

6. Product Philosophy

The platform should follow these principles:

Fast customer path — customers should not wait for expensive analytics work.

Asynchronous heavy work — document ingestion and conversation evaluation should happen through background jobs.

Stateless API layer — API instances should be horizontally scalable.

Tenant isolation — one company's data must never leak into another company's data.

Evidence-based AI — retrieved context, citations, retrieval scores, feedback, and evaluations should be stored for observability.

Use agents where they add value — do not force every request through a complicated agent graph.

Scale architecture without prematurely building distributed-systems complexity.

Production observability from day one.

7. Target Users

Primary Customer

Businesses that need an AI support/knowledge assistant on their website.

Examples:

SaaS companies

E-commerce companies

Logistics companies

Healthcare software companies

Financial services platforms

Education platforms

B2B companies with documentation-heavy products

Internal enterprise knowledge systems

Internal Users

Company admins

Support managers

Knowledge/documentation teams

AI/product teams

8. High-Level User Flow

flowchart TD
    A[Company Signs Up] --> B[Create Organization]
    B --> C[Create AI Agent]
    C --> D[Upload Knowledge Documents]
    D --> E[Async Document Processing]
    E --> F[Chunk + Embed + Index]
    F --> G[Agent Ready]
    G --> H[Generate Embed Code]
    H --> I[Add Widget to Company Website]
    I --> J[Customers Start Chatting]
    J --> K[RAG + Agent + LLM]
    K --> L[Stream Response]
    L --> M[Store Conversation Evidence]
    M --> N[Async Evaluation]
    N --> O[Detect Knowledge Gaps]
    O --> P[Group Similar Failures]
    P --> Q[Dashboard Insights]
    Q --> D

9. System Architecture

9.1 Production-Oriented Architecture

flowchart TB
    U[End User] --> W[Embeddable JS Chat Widget]
    W --> C[CDN / WAF / Edge Layer]
    C --> LB[Load Balancer / API Gateway]

    LB --> API1[FastAPI Instance 1]
    LB --> API2[FastAPI Instance 2]
    LB --> API3[FastAPI Instance N]

    API1 --> AUTH[Auth / Tenant / Agent Context]
    API2 --> AUTH
    API3 --> AUTH

    AUTH --> CHAT[Chat / Conversation Service]
    AUTH --> KB[Knowledge Management Service]
    AUTH --> ANALYTICS[Analytics Service]
    AUTH --> CONFIG[Agent Configuration Service]

    CHAT --> CACHE[Redis]
    CHAT --> RETRIEVAL[Retrieval Layer]
    CHAT --> ORCH[Agent / LLM Orchestrator]
    CHAT --> DB[(Supabase PostgreSQL)]

    KB --> STORAGE[Object Storage]
    KB --> QUEUE[Background Job Queue]
    QUEUE --> WORKERS[Document / Embedding Workers]
    WORKERS --> STORAGE
    WORKERS --> VECTOR[Vector Store]
    WORKERS --> DB

    RETRIEVAL --> VECTOR
    RETRIEVAL --> DB
    ORCH --> LLM[LLM Provider(s)]
    ORCH --> TOOLS[Optional Business Tools / APIs]

    CHAT --> EVENTS[Conversation Events]
    EVENTS --> QUEUE
    QUEUE --> EVAL[Evaluation Worker]
    EVAL --> GAP[Knowledge Gap Engine]
    GAP --> CLUSTER[Semantic Clustering]
    CLUSTER --> DB
    ANALYTICS --> DB

    API1 --> OBS[Observability]
    API2 --> OBS
    API3 --> OBS
    WORKERS --> OBS
    EVAL --> OBS

Important architectural point

The API layer should remain as stateless as possible.

Do not depend on Python process memory for durable state.

Durable or shared state should live in:

Supabase PostgreSQL

Redis

Vector store

Object storage

This allows multiple FastAPI instances to serve requests independently.

10. Recommended Technology Stack

Backend

Python

FastAPI

Pydantic

SQLAlchemy or SQLModel

Async database access

Uvicorn/Gunicorn-style production process management depending on deployment model

Database

Supabase PostgreSQL

Use Supabase as the primary relational database and authentication/platform service where appropriate.

PostgreSQL stores:

Organizations

Users / membership

Agents

Agent configurations

Documents metadata

Document processing state

Conversations

Messages

Evaluation results

Knowledge gaps

Usage metrics

Feedback

API keys / integration metadata

For vector search, evaluate using pgvector in Supabase first so the MVP remains simple. A dedicated vector database can be introduced later if retrieval scale or workload characteristics justify it.

Cache / Ephemeral State

Redis

Use Redis for:

Response caching

Agent configuration caching

Rate limiting

Short-lived conversation state

Job queues / event buffering when appropriate

Distributed locks where needed

Background Processing

For the MVP, use a Redis-backed worker architecture or another simple managed queue.

Background jobs should handle:

Document parsing

Chunking

Embeddings

Indexing

Conversation evaluation

Knowledge-gap aggregation

Analytics aggregation

Do not make the synchronous chat request perform expensive analytics.

LLM

Use a provider abstraction rather than hard-coding a single provider into business logic.

Conceptually:

LLMProvider
├── Provider A
├── Provider B
└── Provider C

This makes model routing and provider replacement easier.

AI Orchestration

LangGraph

Use LangGraph where the workflow genuinely benefits from:

Stateful agent execution

Conditional routing

Tool calling

Multi-step reasoning

Human escalation

Retry / fallback branches

Durable workflow state where appropriate

Do not force every basic RAG query through a large graph.

A simple query should remain fast.

Frontend

Recommended:

Next.js / React

TypeScript

Tailwind CSS or another reusable design system

Query/state management as needed

Responsive dashboard

The platform has two frontend surfaces:

Company dashboard

Embeddable end-user chat widget

Embeddable Widget

Build a small JavaScript/TypeScript widget that can be installed on a customer's website using a script tag.

Example integration:

<script
  src="https://cdn.example.com/widget.js"
  data-agent-id="agent_123"
></script>

Or:

<script src="https://cdn.example.com/widget.js"></script>
<script>
  window.AIChat.init({
    agentId: "agent_123"
  });
</script>

The exact public API can be finalized during implementation.

Object Storage

Use S3-compatible object storage for original documents.

Supabase Storage can be considered for the initial implementation to reduce infrastructure complexity.

Observability

The platform should produce:

Structured logs

Request IDs

Latency metrics

Error metrics

Token usage metrics

Retrieval metrics

LLM timing

Queue/job metrics

Traces where supported

11. Why Supabase?

For the MVP, Supabase is a strong choice because it gives us PostgreSQL and related platform capabilities without requiring us to operate the full database infrastructure ourselves.

Primary benefits:

PostgreSQL

Managed database

SQL

Authentication options

Storage options

Good developer experience

Easy local-to-cloud development workflow

We should still keep our application architecture database-agnostic at the repository/service layer so that migration remains possible later.

12. Core Services

Do not start with dozens of microservices.

For the MVP, use a modular monolith with clearly separated domains.

Suggested logical modules:

API
├── auth
├── organizations
├── agents
├── documents
├── chat
├── retrieval
├── evaluations
├── knowledge_gaps
├── analytics
└── billing/usage (future)

When traffic or team size justifies it, these boundaries can become independently deployable services.

13. Request Flow: Normal Chat

sequenceDiagram
    participant U as User
    participant W as Widget
    participant API as FastAPI
    participant R as Redis
    participant V as Vector Search
    participant O as Agent/LLM Orchestrator
    participant L as LLM
    participant DB as Supabase

    U->>W: Ask question
    W->>API: POST /chat/stream
    API->>API: Authenticate + resolve tenant/agent
    API->>R: Check cache / session data
    API->>V: Retrieve relevant chunks
    V-->>API: Ranked context
    API->>O: Build response workflow
    O->>L: Generate answer
    L-->>O: Stream tokens
    O-->>API: Stream response
    API-->>W: SSE/Web stream
    W-->>U: Render answer
    API->>DB: Store conversation + retrieval evidence

14. Request Flow: Document Upload

sequenceDiagram
    participant C as Company Dashboard
    participant API as FastAPI
    participant DB as Supabase
    participant S as Object Storage
    participant Q as Job Queue
    participant W as Worker
    participant V as Vector Store

    C->>API: Upload document
    API->>S: Store original file
    API->>DB: Create document record (PROCESSING)
    API->>Q: Enqueue ingestion job
    API-->>C: Return job/document status

    Q->>W: Process document
    W->>S: Download document
    W->>W: Extract text
    W->>W: Chunk document
    W->>W: Generate embeddings
    W->>V: Upsert chunks + vectors
    W->>DB: Save processing metadata
    W->>DB: Mark document READY

15. Request Flow: Knowledge Gap Detection

sequenceDiagram
    participant CHAT as Chat Service
    participant Q as Queue
    participant E as Evaluation Worker
    participant G as Knowledge Gap Engine
    participant C as Clustering Engine
    participant DB as Supabase

    CHAT->>Q: Conversation event
    Q->>E: Evaluate conversation
    E->>E: Analyze retrieval quality
    E->>E: Analyze grounding / support
    E->>E: Analyze feedback / outcome
    E->>G: Create gap candidate
    G->>C: Find semantically similar failures
    C-->>G: Cluster/topic
    G->>DB: Upsert knowledge gap
    G->>DB: Update occurrence counters
    G->>DB: Store evidence + metrics

16. Knowledge Gap Detection Design

The platform should not depend on a single confidence number.

Instead, calculate a Knowledge Gap Score from multiple signals.

Example conceptual score:

KnowledgeGapScore =
    w1 * RetrievalWeakness
  + w2 * GroundingWeakness
  + w3 * AnswerFailureSignal
  + w4 * UserNegativeFeedback
  + w5 * RepetitionFrequency

This is a conceptual model, not a fixed production formula.

The implementation should allow weights and thresholds to evolve based on evaluation results.

Signals

Retrieval weakness

Examples:

No relevant chunks found

Low top-k similarity scores

Retrieved chunks are semantically unrelated

Insufficient evidence coverage

Grounding weakness

The generated answer contains claims that are not clearly supported by retrieved context.

Answer failure signal

Examples:

Assistant explicitly says it does not know

Assistant falls back to generic response

Agent cannot complete a requested workflow

User repeats the same question

Human escalation is triggered

User signal

Examples:

Thumbs down

Negative feedback

Conversation abandonment after answer

Repeated clarification

Repetition frequency

A single bad answer may be noise.

One hundred semantically similar failures represent a much stronger signal.

17. Knowledge Gap Clustering

The system should group semantically similar failed questions.

Example:

Can I change my address after shipping?
My package shipped to the wrong address.
Can I redirect my delivery?
I entered the wrong shipping address.
Can the courier change my delivery address?

Instead of showing five separate incidents:

Cluster:
"Delivery Address Changes After Shipment"

The dashboard can then aggregate:

Query count

Unique users

Failed answer rate

Average retrieval score

Negative feedback rate

Most common question variations

Last occurrence

Suggested documentation

18. Knowledge Gap Lifecycle

stateDiagram-v2
    [*] --> DETECTED
    DETECTED --> REVIEWED
    REVIEWED --> CONTENT_REQUESTED
    CONTENT_REQUESTED --> CONTENT_ADDED
    CONTENT_ADDED --> RE_EVALUATING
    RE_EVALUATING --> RESOLVED
    RE_EVALUATING --> DETECTED
    RESOLVED --> [*]

Example:

Detected
   ↓
Company reviews issue
   ↓
Company adds documentation
   ↓
Document re-indexed
   ↓
New customer questions arrive
   ↓
Evaluation compares before vs after
   ↓
Gap becomes RESOLVED if quality improves

19. Dashboard Architecture

Dashboard Navigation

Dashboard
│
├── Overview
├── Agents
│   ├── Agent Settings
│   ├── Behavior
│   ├── Model
│   ├── Appearance
│   └── Embed
│
├── Knowledge Base
│   ├── Documents
│   ├── Upload
│   ├── Processing Status
│   └── Index Health
│
├── Conversations
│   ├── Live / Recent
│   ├── Search
│   ├── Feedback
│   └── Conversation Details
│
├── Knowledge Intelligence ⭐
│   ├── Knowledge Health
│   ├── Knowledge Gaps
│   ├── Top Missing Topics
│   └── Gap Resolution
│
├── Analytics
│   ├── Conversations
│   ├── Resolution Rate
│   ├── Latency
│   ├── Token Usage
│   └── User Satisfaction
│
└── Settings

20. Example Knowledge Intelligence Dashboard

Knowledge Health

Overall Coverage: 82%

Knowledge Gaps: 14

Top Missing Topics

1. Delivery Address Changes      143 queries   32% success
2. International Returns          91 queries   41% success
3. Warranty After Replacement     67 queries   48% success
4. Weekend Delivery               54 queries   51% success
5. Gift Card Expiration           31 queries   55% success

Clicking a gap opens:

Knowledge Gap #KG-10291

Topic:
Delivery Address Changes After Shipment

Occurrences:
143

Answer Success Rate:
32%

Average Retrieval Quality:
Low

Negative Feedback:
38%

Suggested Action:
Add documentation explaining whether and how an
address can be changed once an order has shipped.

Suggested FAQ Questions:
- Can I change my address after shipment?
- Can a shipped order be redirected?
- What happens if I entered the wrong address?
- Can the courier update the destination?

21. Multi-Tenancy Model

This platform is fundamentally multi-tenant.

The hierarchy is:

User
  ↓
Organization / Tenant
  ↓
Agents
  ↓
Documents
  ↓
Conversations
  ↓
Messages / Evaluations / Knowledge Gaps

Every request must resolve a tenant context.

Conceptually:

request
  ↓
identity
  ↓
organization_id
  ↓
agent_id
  ↓
authorization
  ↓
resource query

A user from Organization A must never access:

Organization B documents

Organization B conversations

Organization B vector chunks

Organization B knowledge gaps

Organization B analytics

Tenant isolation is a first-class security requirement.

22. Database Schema

Below is the initial logical schema.

erDiagram
    USERS ||--o{ ORGANIZATION_MEMBERS : belongs_to
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o{ AGENTS : owns
    AGENTS ||--o{ DOCUMENTS : uses
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : contains
    AGENTS ||--o{ CONVERSATIONS : receives
    CONVERSATIONS ||--o{ MESSAGES : contains
    MESSAGES ||--o{ FEEDBACK : receives
    MESSAGES ||--o{ RETRIEVAL_EVIDENCE : produces
    MESSAGES ||--o{ EVALUATIONS : evaluated_by
    AGENTS ||--o{ KNOWLEDGE_GAPS : generates
    KNOWLEDGE_GAPS ||--o{ GAP_EVIDENCE : contains
    ORGANIZATIONS ||--o{ USAGE_RECORDS : generates

    USERS {
        uuid id PK
        string email
        string created_at
    }

    ORGANIZATIONS {
        uuid id PK
        string name
        string created_at
    }

    ORGANIZATION_MEMBERS {
        uuid organization_id FK
        uuid user_id FK
        string role
    }

    AGENTS {
        uuid id PK
        uuid organization_id FK
        string name
        string model
        text system_prompt
        json configuration
        string status
        string created_at
    }

    DOCUMENTS {
        uuid id PK
        uuid organization_id FK
        uuid agent_id FK
        string filename
        string storage_path
        string status
        int chunk_count
        string created_at
    }

    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        vector embedding
        json metadata
    }

    CONVERSATIONS {
        uuid id PK
        uuid agent_id FK
        string visitor_id
        string status
        string created_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        int input_tokens
        int output_tokens
        int latency_ms
        string created_at
    }

    RETRIEVAL_EVIDENCE {
        uuid id PK
        uuid message_id FK
        uuid chunk_id FK
        float similarity_score
        int rank
    }

    EVALUATIONS {
        uuid id PK
        uuid message_id FK
        float retrieval_score
        float grounding_score
        float answer_quality_score
        boolean potential_gap
        json signals
    }

    FEEDBACK {
        uuid id PK
        uuid message_id FK
        int rating
        text reason
        string created_at
    }

    KNOWLEDGE_GAPS {
        uuid id PK
        uuid agent_id FK
        string title
        text description
        int occurrence_count
        float success_rate
        float gap_score
        string status
        string created_at
        string updated_at
    }

    GAP_EVIDENCE {
        uuid id PK
        uuid knowledge_gap_id FK
        uuid message_id FK
        string created_at
    }

    USAGE_RECORDS {
        uuid id PK
        uuid organization_id FK
        date usage_date
        int request_count
        int input_tokens
        int output_tokens
    }

23. Suggested API Surface

The exact API contract should evolve during implementation, but the initial API can be structured like this.

Authentication / Organizations

POST   /api/v1/auth/session
GET    /api/v1/me
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/{organization_id}

Agents

GET    /api/v1/agents
POST   /api/v1/agents
GET    /api/v1/agents/{agent_id}
PATCH  /api/v1/agents/{agent_id}
DELETE /api/v1/agents/{agent_id}

Documents

GET    /api/v1/agents/{agent_id}/documents
POST   /api/v1/agents/{agent_id}/documents
GET    /api/v1/documents/{document_id}
DELETE /api/v1/documents/{document_id}
GET    /api/v1/documents/{document_id}/status

Chat

POST   /api/v1/agents/{agent_id}/conversations
POST   /api/v1/conversations/{conversation_id}/messages
GET    /api/v1/conversations/{conversation_id}
GET    /api/v1/conversations/{conversation_id}/messages

For the public widget, expose a carefully scoped public API with signed widget/session credentials instead of exposing privileged dashboard credentials.

Feedback

POST   /api/v1/messages/{message_id}/feedback

Knowledge Intelligence

GET    /api/v1/agents/{agent_id}/knowledge-health
GET    /api/v1/agents/{agent_id}/knowledge-gaps
GET    /api/v1/knowledge-gaps/{gap_id}
PATCH  /api/v1/knowledge-gaps/{gap_id}
GET    /api/v1/knowledge-gaps/{gap_id}/evidence

Analytics

GET    /api/v1/agents/{agent_id}/analytics/overview
GET    /api/v1/agents/{agent_id}/analytics/latency
GET    /api/v1/agents/{agent_id}/analytics/questions
GET    /api/v1/agents/{agent_id}/analytics/usage

24. Example Chat Response Contract

For streaming responses, prefer an SSE or compatible streaming protocol.

Conceptually:

{
  "conversation_id": "conv_123",
  "message_id": "msg_456",
  "agent_id": "agent_789",
  "type": "token",
  "content": "Based on our return policy..."
}

At the end of the stream, emit metadata similar to:

{
  "type": "complete",
  "message_id": "msg_456",
  "latency_ms": 1420,
  "retrieval_count": 5,
  "cache_hit": false
}

Do not expose internal secrets, privileged evaluation data, or unsafe debugging metadata to the public widget.

25. Agent Architecture

The agent system should use a router-first architecture.

flowchart TD
    Q[User Query] --> R[Intent / Query Router]
    R --> S{Needs Complex Reasoning?}

    S -->|No| SIMPLE[Fast RAG Path]
    S -->|Yes| GRAPH[LangGraph Workflow]

    SIMPLE --> RET[Retriever]
    RET --> LLM[LLM]
    LLM --> OUT[Answer]

    GRAPH --> RET2[Retriever]
    GRAPH --> TOOLS[Tools]
    GRAPH --> MEMORY[Conversation State]
    RET2 --> DECIDE[Agent Decision]
    TOOLS --> DECIDE
    MEMORY --> DECIDE
    DECIDE --> LLM2[LLM]
    LLM2 --> OUT

Principle

Do not use a complex agent graph simply because LangGraph is available.

The system should optimize for:

correctness

latency

cost

maintainability

26. RAG Pipeline

flowchart LR
    Q[User Query] --> E[Query Embedding]
    E --> V[Vector Search]
    V --> F[Metadata / Tenant Filter]
    F --> R[Rank / Rerank]
    R --> C[Context Builder]
    C --> P[Prompt / Agent Context]
    P --> L[LLM]
    L --> A[Answer + Citations]

The retrieval layer must always enforce tenant and agent boundaries.

27. Document Processing Pipeline

flowchart TD
    F[Uploaded File] --> V[Validate File]
    V --> S[Store Original]
    S --> X[Extract Text]
    X --> N[Normalize]
    N --> CH[Chunk]
    CH --> EM[Generate Embeddings]
    EM --> IDX[Index in Vector Store]
    IDX --> META[Store Metadata]
    META --> READY[Document READY]

Documents should move through explicit statuses such as:

UPLOADED
PROCESSING
READY
FAILED
DELETING
DELETED

28. Performance Architecture

The user-facing request path should be optimized aggressively.

Target flow:

Request
 ↓
Auth / tenant resolution
 ↓
Fast retrieval
 ↓
LLM first-token generation
 ↓
Stream output immediately

Heavy work should be moved off the request path:

Conversation
 ↓
Event
 ↓
Queue
 ↓
Evaluation Worker
 ↓
Knowledge Gap Engine

Caching opportunities

Use Redis for high-value repeated data such as:

Agent configuration

Common question answers

Rate limits

Session data

Short-lived retrieval caches where safe

Cache keys must include tenant/agent scope where applicable.

Bad:

answer:{question_hash}

Better:

answer:{tenant_id}:{agent_id}:{question_hash}:{knowledge_version}

This prevents stale or cross-tenant results.

29. Scalability Strategy

The architecture should support horizontal scaling.

flowchart TB
    LB[Load Balancer]
    LB --> A1[FastAPI Pod 1]
    LB --> A2[FastAPI Pod 2]
    LB --> A3[FastAPI Pod N]

    A1 --> REDIS[Redis]
    A2 --> REDIS
    A3 --> REDIS

    A1 --> DB[(PostgreSQL)]
    A2 --> DB
    A3 --> DB

    Q[Queue] --> W1[Worker 1]
    Q --> W2[Worker 2]
    Q --> WN[Worker N]

    W1 --> DB
    W2 --> DB
    WN --> DB

Important

The phrase "millions of users" should be treated as an architectural goal, not a claim that the MVP has already been capacity-tested for millions of concurrent users.

The MVP should be designed so that capacity can be increased by:

adding API replicas

adding workers

adding cache capacity

scaling PostgreSQL

introducing read replicas

separating retrieval workloads

introducing dedicated vector infrastructure

improving queue throughput

using autoscaling

when real traffic justifies those changes.

30. Reliability and Failure Handling

The system should expect failures.

Examples:

LLM timeout

LLM rate limit

Vector search timeout

Redis unavailable

Worker failure

Document parsing failure

Embedding API failure

Invalid uploaded file

Model provider outage

Database timeout

The architecture should support:

timeouts

bounded retries

exponential backoff where appropriate

idempotent background jobs

dead-letter handling where supported

fallback model/provider where appropriate

clear user-facing degradation behavior

Example:

flowchart TD
    Q[Chat Request] --> LLM[Primary LLM]
    LLM -->|Success| A[Answer]
    LLM -->|Timeout / Rate Limit| F[Fallback Strategy]
    F --> ALT[Alternative Model / Graceful Response]
    ALT --> A

Do not blindly retry every error.

Retries should be limited and error-type aware.

31. Security Requirements

Security is a first-class requirement.

Authentication

Use secure authentication for dashboard users.

Authorization

Use organization membership and role checks.

Example roles:

OWNER
ADMIN
MEMBER
VIEWER

Tenant Isolation

Every protected resource access must verify:

user -> organization -> agent -> resource

File Security

Validate:

file type

file size

content where appropriate

upload authorization

Secrets

Never store provider API secrets in the browser.

Never expose server-side LLM credentials through the widget.

Prompt Injection

Treat retrieved documents as data, not privileged instructions.

The system prompt, tool permissions, and policy should not be overridden by arbitrary document text.

Abuse Prevention

Implement:

rate limits

request size limits

authentication controls

origin validation / signed widget credentials

usage limits

32. Observability

Every important request should have a request/correlation ID.

Example:

Request ID: req_83921

Total Latency: 1.72s

Auth: 8ms
Redis: 3ms
Retrieval: 82ms
LLM First Token: 420ms
Generation: 1.1s

Cache: MISS

Input Tokens: 1240
Output Tokens: 210

Status: SUCCESS

This allows performance debugging such as:

P95 latency increased
        ↓
Trace request
        ↓
Retrieval = 900ms
        ↓
Investigate vector search

33. Metrics to Track

Product metrics

Total conversations

Total messages

Resolution rate

Fallback rate

Knowledge gap count

Knowledge gap resolution rate

User satisfaction

AI metrics

Retrieval relevance

Grounding score

Answer quality

Hallucination/failure rate where measurable

Tokens per request

Cost per request

Model usage distribution

Infrastructure metrics

Requests per second

P50 latency

P95 latency

P99 latency

Error rate

Queue depth

Worker throughput

Redis latency

Database latency

LLM latency

34. Cost Awareness

LLM calls are one of the most important variable costs.

We should therefore build toward:

Simple question
    ↓
Cheaper / faster model

Complex question
    ↓
Stronger model

We can also optimize using:

semantic/response caching

smaller prompts

better chunking

top-k optimization

model routing

batch embeddings

asynchronous evaluation

avoiding unnecessary agent loops

A critical design goal is:

Do not spend an expensive model call when a cheaper retrieval or cached answer is sufficient.

35. Suggested Repository Structure

Use a modular backend structure instead of one giant main.py.

project-root/
│
├── README.md
├── .env.example
├── docker-compose.yml
├── pyproject.toml
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   ├── router.py
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── organizations.py
│   │   │       ├── agents.py
│   │   │       ├── documents.py
│   │   │       ├── conversations.py
│   │   │       ├── feedback.py
│   │   │       ├── knowledge_gaps.py
│   │   │       └── analytics.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   ├── security.py
│   │   │   ├── exceptions.py
│   │   │   └── observability.py
│   │   │
│   │   ├── db/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   └── session.py
│   │   │
│   │   ├── domains/
│   │   │   ├── agents/
│   │   │   ├── organizations/
│   │   │   ├── documents/
│   │   │   ├── conversations/
│   │   │   ├── evaluations/
│   │   │   ├── knowledge_gaps/
│   │   │   └── analytics/
│   │   │
│   │   ├── ai/
│   │   │   ├── embeddings/
│   │   │   ├── llm/
│   │   │   ├── retrieval/
│   │   │   ├── prompts/
│   │   │   ├── evaluators/
│   │   │   └── graphs/
│   │   │
│   │   ├── workers/
│   │   │   ├── document_jobs.py
│   │   │   ├── evaluation_jobs.py
│   │   │   └── analytics_jobs.py
│   │   │
│   │   └── schemas/
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── frontend/
│   └── dashboard/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── hooks/
│       └── types/
│
├── widget/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── infra/
│   ├── docker/
│   ├── migrations/
│   └── deployment/
│
└── docs/
    ├── architecture/
    ├── api/
    ├── decisions/
    └── diagrams/

The exact folder structure can be adjusted during implementation, but responsibilities should remain separated.

36. Architectural Boundary Rules

The codebase should enforce these rules:

API layer

Responsible for:

HTTP

authentication

authorization

validation

response serialization

It should not contain deep business logic.

Domain/service layer

Responsible for:

business rules

orchestration

use cases

Repository/data layer

Responsible for:

database queries

persistence

AI layer

Responsible for:

retrieval

prompting

LLM provider abstraction

embeddings

agent graphs

evaluations

Worker layer

Responsible for:

asynchronous operations

document ingestion

evaluation

aggregation

This prevents a giant route handler from becoming the entire application.

37. MVP Scope

The first implementation should contain only the minimum required system.

MVP must have

Authentication / Tenant

Sign up / sign in

Organization

Organization membership

Agent

Create agent

Configure name

Configure instructions

Configure model

Configure appearance

Knowledge

Upload PDF / text-based documents initially

Store documents

Background processing

Chunking

Embeddings

Vector search

Chat

Embedded widget

Conversation creation

Streaming responses

Basic conversation history

Evaluation

Store retrieval evidence

Store response metadata

Evaluate answer quality

Detect potential knowledge gaps

Knowledge Intelligence

Aggregate repeated failures

Semantic grouping

Knowledge Gap dashboard

Gap status

Recommendation text

Analytics

conversation count

answer success

average latency

knowledge gaps

38. Explicitly NOT in MVP

Do not build these unless the product requires them later:

Kubernetes from day one

Kafka from day one

Microservice explosion

Complex billing system

Voice agent

WhatsApp integration

CRM integration

Email automation

Fully autonomous content publishing

Model fine-tuning pipeline

Custom model training

Enterprise SSO before core functionality is stable

Multi-region deployment before the single-region architecture is proven

The product should first prove:

Chat works + RAG works + knowledge gaps are detected + dashboard is useful.

39. Development Phases

Phase 1 — Foundation

Repository setup

FastAPI application

Supabase connection

environment management

migrations

authentication

organization model

base logging

API versioning

Phase 2 — Agent Management

CRUD agents

agent configuration

API validation

authorization

Phase 3 — Knowledge Base

upload documents

object storage

processing state

background workers

text extraction

chunking

embeddings

vector indexing

Phase 4 — Chat

conversations

messages

retrieval

LLM provider abstraction

streaming

basic prompt system

Phase 5 — Widget

embeddable script

appearance configuration

signed initialization/session flow

streaming UI

Phase 6 — Evaluation

retrieval evidence storage

answer evaluation

grounding checks

feedback

failure signals

Phase 7 — Knowledge Intelligence

knowledge gap scoring

semantic clustering

gap aggregation

recommendation generation

dashboard

Phase 8 — Production Hardening

rate limiting

caching

retries/timeouts

observability

performance profiling

database indexes

background job reliability

security hardening

Phase 9 — Scale Preparation

Only after profiling and real workload testing:

horizontal scaling

worker autoscaling

database optimization

read replicas

dedicated vector store if required

queue upgrades

CDN optimization

advanced caching

40. Testing Strategy

The platform should use multiple layers of testing.

Unit Tests

Test:

business rules

scoring functions

tenant checks

chunking logic

gap aggregation

prompt construction

Integration Tests

Test:

Supabase/PostgreSQL

Redis

vector retrieval

document ingestion

worker jobs

LLM adapter contracts

E2E Tests

Test the full flow:

Create organization
 → Create agent
 → Upload document
 → Wait for indexing
 → Ask question
 → Receive answer
 → Store evidence
 → Evaluation runs
 → Knowledge gap appears

AI Evaluation Tests

Keep a versioned evaluation dataset containing:

question

expected source

expected behavior

acceptable answer characteristics

Use it to detect regressions in retrieval and answer quality.

41. Production Engineering Principles

Do

Use dependency injection

Validate inputs

Use structured logs

Add timeouts

Add indexes

Use connection pooling

Keep API handlers thin

Make jobs idempotent

Store request IDs

Version prompts

Version evaluation logic

Measure before optimizing

Avoid

giant route handlers

synchronous heavy document processing

global mutable state

hard-coded model-specific logic everywhere

cross-tenant queries without filters

hidden retries

infinite agent loops

storing secrets in frontend code

overengineering the MVP

42. Example End-to-End Data Flow

flowchart TD
    A[Company User] --> B[Dashboard]
    B --> C[Create Agent]
    C --> D[Upload Documents]

    D --> E[FastAPI]
    E --> F[Supabase Storage]
    E --> G[PostgreSQL Document Record]
    E --> H[Background Queue]

    H --> I[Document Worker]
    I --> J[Extract]
    J --> K[Chunk]
    K --> L[Embed]
    L --> M[Vector Index]

    N[Website Visitor] --> O[Embedded Widget]
    O --> E2[Chat API]
    E2 --> P[Retrieve Knowledge]
    P --> M
    E2 --> Q[LangGraph / Simple RAG Router]
    Q --> R[LLM Provider]
    R --> S[Streaming Answer]
    S --> O

    E2 --> T[Conversation Store]
    T --> U[Evaluation Queue]
    U --> V[Evaluation Worker]
    V --> W[Knowledge Gap Engine]
    W --> X[Semantic Clustering]
    X --> Y[Knowledge Gap Record]
    Y --> B

43. Example: From Failure to Knowledge Gap

flowchart TD
    Q1[Can I change my address after shipment?]
    Q2[I entered the wrong delivery address]
    Q3[Can the courier redirect the package?]
    Q4[Can I update my address after dispatch?]

    Q1 --> EMB[Semantic Representation]
    Q2 --> EMB
    Q3 --> EMB
    Q4 --> EMB

    EMB --> CLUSTER[Semantic Cluster]
    CLUSTER --> TOPIC[Delivery Address Changes After Shipment]

    TOPIC --> METRICS[Aggregate Evidence]
    METRICS --> GAP[Knowledge Gap]
    GAP --> DASH[Dashboard Recommendation]

44. Knowledge Gap Recommendation Engine

The recommendation engine should not invent policy facts.

It should primarily recommend what information is missing, for example:

"Customers frequently ask whether delivery addresses can be changed after shipment. The current knowledge base does not provide explicit guidance for this scenario. Add a section covering eligibility, timing, restrictions, and escalation behavior."

This is safer and more useful than automatically inventing a policy answer.

Potential outputs:

Suggested FAQ topic

Missing subtopics

Example user questions

Suggested documentation title

Priority score

Estimated impact based on query volume

45. Knowledge Health Score

A high-level dashboard score can combine:

Knowledge Health =
    Answer Coverage
  + Retrieval Quality
  + Grounding Quality
  + Resolved Gap Rate
  + User Satisfaction

This should be treated as a product metric, not a scientific truth.

The underlying components must remain visible so users can understand why the score changed.

46. Important AI Design Principle

The system should distinguish between:

"The model does not know"

and

"The knowledge base does not contain the answer"

These are not always the same problem.

Possible failure reasons include:

1. Missing document
2. Poor chunking
3. Poor retrieval
4. Wrong ranking
5. Context truncation
6. Prompt issue
7. Model reasoning failure
8. Tool failure
9. Genuine knowledge gap

Therefore, the Knowledge Gap Engine should maintain a distinction between:

retrieval failure

grounding failure

generation failure

knowledge gap candidate

Only the latter should become a business knowledge recommendation after sufficient evidence.

This is an important part of making the project technically credible.

47. What Happens When the User Asks a Question?

A professional-looking response pipeline might be:

flowchart TD
    Q[User Question] --> AUTH[Validate Session]
    AUTH --> RATE[Rate Limit]
    RATE --> CACHE{Cached Answer?}

    CACHE -->|Yes| STREAM1[Stream Cached Response]
    CACHE -->|No| ROUTER[Query Router]

    ROUTER --> SIMPLE{Simple Query?}
    SIMPLE -->|Yes| RET1[RAG Retrieval]
    SIMPLE -->|No| GRAPH[LangGraph Workflow]

    RET1 --> CHECK[Evidence Check]
    GRAPH --> CHECK

    CHECK --> GEN[LLM Generation]
    GEN --> STREAM2[Stream Response]

    STREAM2 --> STORE[Store Conversation Evidence]
    STORE --> EVENT[Queue Evaluation Event]

48. Why We Should Use a Modular Monolith First

We want good architecture without unnecessary operational complexity.

A modular monolith gives us:

clean domain boundaries

one deployment unit initially

easier local development

easier debugging

lower infrastructure cost

easier transactions

clear future service boundaries

Potential future extraction:

Current
FastAPI Modular Monolith

Later

API Service
Chat Service
Knowledge Service
Evaluation Service
Worker Service

We should extract services only when justified by:

independent scaling requirements

deployment frequency

team ownership

fault isolation

workload differences

49. Future Extensions

These are intentionally outside the MVP but fit the architecture.

Business Tools

An agent may later call:

order API

CRM

booking API

ticketing system

inventory API

account API

Human Escalation

AI cannot answer
      ↓
Create support ticket
      ↓
Human agent

Knowledge Versioning

Allow companies to see:

Knowledge Base v12
Knowledge Base v13

and compare answer quality before/after.

A/B Testing

Compare:

chunking strategy

prompts

models

retrievers

Model Routing

Use different models based on complexity and cost.

Advanced Evaluation

automated regression tests

retrieval benchmark datasets

answer quality benchmark

hallucination detection

50. Interview Discussion: "Why FastAPI?"

Suggested answer:

"We use FastAPI because Python is the ecosystem we want for the AI layer, and FastAPI gives us a strong foundation for async HTTP APIs, validation, dependency injection, streaming, and containerized deployment. The important scalability property is not FastAPI by itself; it's that the API layer is stateless and can be horizontally scaled behind a load balancer."

51. Interview Discussion: "Why Supabase/PostgreSQL?"

Suggested answer:

"PostgreSQL is our source of truth for business and conversational data, while Supabase gives us managed PostgreSQL and platform capabilities with a fast development workflow. For the initial system, pgvector is a natural way to keep relational data and vector retrieval close together. If retrieval workload characteristics eventually justify it, we can introduce a dedicated vector system without changing the rest of the domain architecture."

52. Interview Discussion: "Why Redis?"

Suggested answer:

"Redis is useful for low-latency ephemeral data such as rate limiting, cache entries, short-lived session state, and queue-related workloads. It prevents us from putting frequently accessed short-lived state into the primary database and also supports horizontal API scaling."

53. Interview Discussion: "Why Background Workers?"

Suggested answer:

"Operations like document parsing, embedding generation, indexing, and conversation evaluation can be expensive and slow. Making the user request wait for those operations would increase latency and reduce throughput. We therefore move them to asynchronous workers, allowing the user-facing API to stay fast."

54. Interview Discussion: "Why LangGraph?"

Suggested answer:

"We are not using LangGraph just because it is an AI framework. We use it where the system needs stateful, multi-step workflows such as tool calling, conditional routing, retries, escalation, or complex agent behavior. Simple FAQ-style queries should use a faster direct RAG path."

55. Interview Discussion: "Does the AI Train Itself?"

Do not say:

"LangGraph trains itself."

Better answer:

"The platform does not automatically retrain the language model. Instead, it continuously evaluates production conversations, detects knowledge gaps and failure patterns, and recommends what information should be added or improved. We can later build a controlled optimization pipeline for prompts, retrieval configuration, or evaluation-driven model selection."

56. Interview Discussion: "How Do You Handle Millions of Users?"

Suggested answer:

"We don't rely on a single FastAPI server. The API is stateless and can run multiple replicas behind a load balancer. Shared state is stored in PostgreSQL and Redis, heavy operations are moved to background workers, responses can be cached and streamed, and the database/retrieval layer can be scaled independently. The MVP is deliberately a modular monolith, but its boundaries are designed so that high-load components can be extracted when real traffic requires it."

Also be honest:

"We would validate the capacity with load testing before claiming support for a specific number of concurrent users. The architecture is designed for horizontal growth, but capacity claims should be evidence-based."

57. Interview Discussion: "What Happens When Your RAG Fails?"

Suggested answer:

"We treat retrieval failure, generation failure, and genuine knowledge gaps as separate signals. The system stores retrieval evidence and evaluates answer quality asynchronously. When similar failures repeat, we cluster them semantically and surface a Knowledge Gap on the dashboard. This lets the company improve the knowledge base instead of simply logging failed conversations."

58. Interview Discussion: "What Is the Most Important Architectural Decision?"

A strong answer:

"The most important decision is separating the real-time customer path from the asynchronous intelligence path. The customer needs a low-latency response, while document processing, evaluation, clustering, and analytics are expensive background workloads. By separating these paths, we protect chat latency while still enabling sophisticated knowledge analysis."

59. Anti-Patterns to Avoid

Anti-pattern 1: One giant FastAPI route

Avoid:

@app.post("/chat")
def chat():
    # auth
    # db
    # retrieval
    # prompting
    # model
    # analytics
    # evaluation
    # everything else

Instead, route → service → repository/AI components.

Anti-pattern 2: Synchronous document processing

Never make the user wait for a large document to be embedded.

Anti-pattern 3: Agent for every request

Keep simple questions simple.

Anti-pattern 4: Trusting one confidence number

Use multiple evaluation signals.

Anti-pattern 5: Mixing tenants

Tenant scope must be explicit throughout the system.

Anti-pattern 6: Premature microservices

Start modular. Extract only when justified.

Anti-pattern 7: Claiming "millions" without load testing

Architectural scalability and demonstrated capacity are different things.

60. Definition of Done for MVP

The MVP is complete when the following end-to-end scenario works:

Company signs up
    ↓
Creates organization
    ↓
Creates agent
    ↓
Uploads knowledge document
    ↓
Document processes asynchronously
    ↓
Document becomes READY
    ↓
Company embeds widget
    ↓
Customer asks question
    ↓
System retrieves relevant knowledge
    ↓
LLM generates streamed answer
    ↓
Conversation is persisted
    ↓
Evaluation runs asynchronously
    ↓
Weak/failed question is detected
    ↓
Similar failures are grouped
    ↓
Knowledge Gap appears on dashboard
    ↓
Company sees recommendation

If this flow works reliably, the core product has been proven.

61. Suggested Demo Scenario

Use one fictional company during development, for example:

Acme Furniture

Upload:

Return Policy.pdf

Shipping Policy.pdf

Warranty.pdf

Product Catalog.pdf

FAQ.pdf

Then ask normal questions:

What is your return period?
What is the warranty period?
Do you ship internationally?

Then intentionally create a knowledge gap:

Can I change my address after my order has shipped?

Ask several semantically similar variations:

I entered the wrong address.
Can my package be redirected?
Can the courier change my delivery address?

Then open the dashboard and show:

Knowledge Gap Detected

Delivery Address Changes After Shipment

143 occurrences
32% successful answers

Recommendation:
Add explicit documentation for post-shipment
address changes.

Then add a new document section and show the gap improving.

This creates an excellent end-to-end demonstration.

62. The Product Story

The story we want to tell is:

Deploy once. Improve continuously.

Companies should not have to hire an AI team just to maintain a support chatbot.

They provide the knowledge.

Our platform provides:

Infrastructure
+
RAG
+
Agents
+
Security
+
Scaling
+
Analytics
+
Knowledge Intelligence

And the most important differentiator is:

The platform tells the company what its AI still does not know.

63. Recommended First Technical Task for Antigravity

Before generating code, Antigravity should treat this README as the product/architecture source of truth and do the following in order:

Inspect the repository state.

Propose the final folder structure.

Identify implementation assumptions.

Confirm the MVP boundaries defined here.

Design database migrations.

Design service/domain boundaries.

Design API contracts.

Design the document ingestion pipeline.

Design the chat and streaming path.

Design the evaluation and Knowledge Gap pipeline.

Implement incrementally with tests.

Run local end-to-end flows.

Add observability and failure handling.

Only then optimize or extract components.

Do not immediately generate hundreds of files.

Build vertically through the core flow.

64. Suggested Implementation Order

The implementation order should be:

Foundation
   ↓
Auth + Tenancy
   ↓
Agent CRUD
   ↓
Document Upload
   ↓
Async Ingestion
   ↓
Vector Search
   ↓
Chat
   ↓
Streaming
   ↓
Widget
   ↓
Conversation Evidence
   ↓
Evaluation
   ↓
Knowledge Gap Detection
   ↓
Knowledge Gap Clustering
   ↓
Dashboard
   ↓
Caching + Rate Limiting
   ↓
Observability
   ↓
Load Testing
   ↓
Optimization

65. Final Architecture Summary

flowchart TB
    subgraph CLIENTS[Clients]
        COMPANY[Company Dashboard]
        VISITOR[Website Visitor]
    end

    subgraph EDGE[Edge]
        CDN[CDN / WAF]
        LB[Load Balancer]
    end

    subgraph APP[Application]
        API[FastAPI Modular Monolith]
        CHAT[Chat / Streaming]
        KNOW[Knowledge Management]
        AGENT[Agent / RAG Orchestration]
        EVAL[Evaluation]
        GAP[Knowledge Gap Engine]
    end

    subgraph DATA[Data]
        PG[(Supabase PostgreSQL)]
        REDIS[(Redis)]
        VECTOR[(pgvector / Vector Store)]
        STORAGE[(Object Storage)]
    end

    subgraph WORKERS[Async Processing]
        QUEUE[Job Queue]
        DOCWORKER[Document Workers]
        EVALWORKER[Evaluation Workers]
        CLUSTERWORKER[Gap Clustering / Aggregation]
    end

    subgraph AI[AI Providers]
        LLM[LLM Provider(s)]
        EMBED[Embedding Provider]
    end

    COMPANY --> CDN
    VISITOR --> CDN
    CDN --> LB
    LB --> API

    API --> CHAT
    API --> KNOW
    API --> AGENT
    API --> EVAL
    API --> GAP

    CHAT --> REDIS
    CHAT --> PG
    CHAT --> AGENT
    AGENT --> VECTOR
    AGENT --> LLM

    KNOW --> STORAGE
    KNOW --> PG
    KNOW --> QUEUE

    QUEUE --> DOCWORKER
    DOCWORKER --> STORAGE
    DOCWORKER --> EMBED
    DOCWORKER --> VECTOR
    DOCWORKER --> PG

    CHAT --> QUEUE
    QUEUE --> EVALWORKER
    EVALWORKER --> EVAL
    EVAL --> GAP
    GAP --> CLUSTERWORKER
    CLUSTERWORKER --> PG

    API --> PG
    API --> REDIS

66. Final Product Definition

Product

AI Knowledge Intelligence Platform

Core capability

Businesses deploy AI agents backed by their own knowledge.

Primary differentiator

The system continuously discovers and groups knowledge failures and tells businesses what information their AI needs next.

Core stack

Python
FastAPI
PostgreSQL / Supabase
Redis
pgvector initially
Object Storage
Background Workers
LLM Provider(s)
LangGraph where useful
Next.js / React
Embeddable TypeScript Widget
Observability stack

Primary engineering themes

Multi-tenancy
RAG
AI agents
Knowledge evaluation
Knowledge gap detection
Semantic clustering
Async processing
Caching
Rate limiting
Streaming
Horizontal scalability
Security
Observability
Clean architecture

The key differentiator in one line

Other platforms give a company an AI chatbot. This platform gives the company an AI chatbot and tells them where their knowledge base is failing.

67. Important Engineering Note

This README describes the target architecture and product direction.

Not every component should exist in the first commit.

The implementation should begin with a small, testable, modular system and evolve toward the architecture described here as real requirements and traffic justify it.

The quality bar is:

Simple where possible, sophisticated where necessary, measurable everywhere.

