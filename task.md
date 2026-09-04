So your real architecture becomes:

Customer Website
       │
       │  embedded widget.js
       ▼
┌─────────────────────┐
│ Your Chatbot Widget │
└──────────┬──────────┘
           │
           │ agent_id + site origin
           ▼
┌─────────────────────┐
│      FastAPI        │
└──────────┬──────────┘
           │
      verify domain
           │
           ▼
┌─────────────────────┐
│ Redis / Job Queue   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ Web Crawler Worker       │
│                          │
│ httpx / BeautifulSoup    │
│ Playwright when required │
└──────────┬───────────────┘
           │
           ▼
      Clean Content
           │
           ▼
        Chunking
           │
           ▼
       Embeddings
           │
           ▼
   Supabase / pgvector
           │
           ▼
      RAG Retrieval
           │
           ▼
       AI Agent

And this is how I would divide the work.

Project Execution Plan

Do these in order.

TASK 0
Architecture Audit

TASK 1
Fix Authentication / Login

TASK 2
Design Website Crawl Data Model + APIs

TASK 3
Build Production Website Crawler

TASK 4
Connect Embedded Widget → Automatic Initial Crawl

TASK 5
Build Incremental Re-Crawling

TASK 6
Connect Crawled Content → RAG

TASK 7
Large Knowledge Base / Performance Testing

TASK 8
Deployment / Embed Support

TASK 9
Knowledge Gap Detection

TASK 10
Production Hardening

You should not start Task 4 before Task 3 is stable.

TASK 0 — Audit Existing Codebase

This should be the first prompt you give Antigravity.

Do not ask it to modify anything yet.

PROMPT
Act as a Principal Backend Architect joining an existing production-oriented Python/FastAPI AI platform.

You are NOT allowed to immediately change code.

First, perform a complete architecture audit of the existing project.

Project:
RagApp

The platform is intended to support:

- AI agents
- RAG
- document ingestion
- website crawling
- embedded chatbot widgets
- multi-tenancy
- Supabase/PostgreSQL
- Redis
- background workers
- LangGraph
- knowledge gap detection

IMPORTANT:
I want to implement this incrementally.

Your first task is ONLY to understand the existing codebase.

Inspect:

1. backend structure
2. frontend structure
3. database models
4. API routes
5. authentication
6. agent configuration
7. document ingestion
8. RAG implementation
9. vector storage
10. Redis usage
11. Docker configuration
12. existing website crawler implementation
13. existing embed/widget implementation
14. background job implementation
15. environment configuration

Do not rewrite the architecture.

Do not create new code unless absolutely necessary for inspection/testing.

Produce an architecture report containing:

A. Current architecture

B. Current request/data flow

C. Current database flow

D. Current RAG flow

E. Current crawler implementation, if any

F. Current authentication flow

G. Current chatbot deployment flow

H. Existing reusable components

I. Duplicate logic

J. Scalability risks

K. Security risks

L. Missing abstractions

M. What should be changed

N. What should NOT be changed

O. Recommended implementation order

Pay special attention to whether the current application can support:

Customer Website
        ↓
Embedded JS
        ↓
FastAPI
        ↓
Background Crawl
        ↓
Website Content
        ↓
Embeddings
        ↓
Vector Store
        ↓
RAG

Also inspect whether the existing architecture allows the crawler to run asynchronously.

Do NOT implement changes yet.

At the end provide:

1. Current architecture diagram
2. Recommended architecture diagram
3. List of files that must change for the next task
4. List of files that should remain untouched
5. Recommended next implementation task
Why this task matters

Antigravity may discover that you already have parts of this functionality. Don't let it create duplicate:

crawler.py
crawler2.py
website_scraper.py
web_scraper_new.py

That becomes a nightmare.

TASK 1 — Fix the Login Problem

Your screenshot shows the immediate UX problem: there is no visible login option where your flow expects one.

Don't mix authentication work with crawling.

PROMPT
Act as a senior full-stack engineer.

We are working on an existing FastAPI + frontend AI chatbot platform.

Fix ONLY the authentication/login flow.

Current problem:

The application currently does not consistently display or expose the Login option in the expected locations.

Your job:

1. Trace the existing authentication architecture.
2. Identify the root cause.
3. Fix the login UI.
4. Fix frontend routing if necessary.
5. Fix session/token persistence if necessary.
6. Ensure authenticated routes are protected.
7. Ensure unauthenticated users are redirected correctly.
8. Ensure logout works.
9. Ensure refreshing the browser does not incorrectly destroy authentication state.
10. Ensure chatbot/agent dashboard pages correctly know whether the user is authenticated.

Do NOT redesign the application.

Do NOT touch RAG logic.

Do NOT touch crawler logic.

Do NOT add unrelated functionality.

Before modifying code:

Explain:

- root cause
- affected files
- proposed fix
- authentication flow

Then implement the fix.

After implementation:

Test:

- signup
- login
- logout
- refresh
- unauthenticated dashboard access
- authenticated dashboard access
- invalid credentials
- expired/invalid token

Finally provide:

- root cause
- files changed
- exact behavior before/after
- tests performed
TASK 2 — Build the Website Crawl Data Model + API

Before Playwright, define the backend properly.

The crawler should not directly dump everything into the vector DB.

You need a pipeline.

Data model

Conceptually:

Organization
    │
    └── Agent
          │
          ├── Knowledge Source
          │       │
          │       ├── Website
          │       ├── Sitemap
          │       └── Documents
          │
          └── Documents
                 │
                 └── Chunks
                        │
                        └── Embeddings
PROMPT
Act as a senior backend architect.

Implement the data model and API contracts required for website crawling.

DO NOT build the crawler yet.

We need to support:

1. Agent
2. KnowledgeSource
3. CrawledPage
4. Document
5. DocumentChunk
6. CrawlJob
7. CrawlRun

The system is multi-tenant.

Every knowledge source MUST belong to an organization and agent.

Design the database so one company can never access another company's crawled content.

Suggested concepts:

KnowledgeSource

- id
- organization_id
- agent_id
- type
- url
- sitemap_url
- status
- created_at
- updated_at
- last_crawled_at
- last_successful_crawl_at

CrawlJob

- id
- organization_id
- agent_id
- knowledge_source_id
- status
- started_at
- completed_at
- pages_discovered
- pages_processed
- pages_failed
- error_summary

CrawledPage

- id
- knowledge_source_id
- url
- canonical_url
- title
- content_hash
- status
- last_crawled_at
- last_changed_at

Document

- id
- organization_id
- agent_id
- source_page_id
- title
- source_url
- content
- content_hash
- status

DocumentChunk

- id
- document_id
- chunk_index
- content
- embedding
- metadata

Implement appropriate indexes and uniqueness constraints.

Important constraints:

- same URL should not create duplicate active pages
- same organization cannot have unrestricted access to another organization's data
- repeated crawl of unchanged content should NOT generate duplicate chunks
- crawl jobs must be auditable

Create API contracts for:

POST /api/knowledge/websites

POST /api/knowledge/websites/{id}/crawl

GET /api/knowledge/websites/{id}

GET /api/knowledge/websites/{id}/status

GET /api/knowledge/websites/{id}/pages

Do not implement crawling yet.

Implement only:

- models
- migrations
- schemas
- repository/service layer
- API routes

Follow the existing project's architecture.

Do not create unnecessary microservices.

Use the existing database conventions.
TASK 3 — THIS IS THE BIG ONE: Production Website Crawler

Now we build the actual crawler.

And here I would make one major change to your original thinking:

Do NOT use Playwright for everything.

Use a tiered crawling strategy.

URL
 ↓
Try lightweight HTTP fetch
 ↓
Is useful content available?
 ├── YES → parse HTML
 │
 └── NO
       ↓
  Playwright
       ↓
  Render JavaScript
       ↓
  extract content

Why?

Because Playwright is much more expensive than a simple HTTP request.

If a site has 2,000 pages, you don't want to launch a browser for all 2,000 pages unnecessarily.

Crawler requirements

It should understand:

robots.txt
sitemap.xml
canonical URLs
redirects
same-domain restriction
duplicate URLs
URL normalization
hashing
timeouts
retries
rate limiting

And:

public pages only

It must NOT attempt to crawl:

/login
/admin
/dashboard
/account
/private

unless explicitly configured and authenticated.

PROMPT
Act as a Principal Python Backend Engineer specializing in web crawling, distributed systems and AI data pipelines.

Implement a production-oriented website crawler for our FastAPI AI/RAG platform.

IMPORTANT:

This crawler runs SERVER-SIDE.

The embedded chatbot widget must NOT attempt to scrape arbitrary website DOM content in the browser.

The backend worker performs the crawl.

Primary technologies:

- Python
- FastAPI
- httpx
- BeautifulSoup / lxml
- Playwright
- Redis
- PostgreSQL / Supabase
- background worker system already present in the project

Do not create a new architecture if an existing worker architecture exists.

--------------------------------------------------
GOAL
--------------------------------------------------

Given:

https://example.com

the crawler should discover and index publicly accessible website content.

Supported discovery mechanisms:

1. root URL
2. sitemap.xml
3. sitemap index files
4. internal links

Example:

https://example.com
        ↓
sitemap.xml
        ↓
/about
/products
/pricing
/faq
/shipping
/returns
/contact
/docs/...

Continue:

--------------------------------------------------
DOMAIN SAFETY
--------------------------------------------------

Only crawl URLs belonging to the approved website domain.

For example:

Allowed:

https://example.com
https://example.com/about
https://docs.example.com/*

Only allow subdomains if explicitly configured.

Never silently crawl unrelated domains.

--------------------------------------------------
PUBLIC CONTENT ONLY
--------------------------------------------------

The crawler must never attempt to bypass authentication.

Do not crawl:

/login
/admin
/account
/dashboard
/private
/user
/checkout

unless explicitly configured as an authenticated knowledge source in a future feature.

For this implementation, ONLY crawl public pages.

--------------------------------------------------
ROBOTS
--------------------------------------------------

Respect robots.txt where appropriate.

Fetch robots.txt before crawling.

Use sensible crawl delays and request limits.

--------------------------------------------------
CRAWLER STRATEGY
--------------------------------------------------

Implement tiered extraction.

LEVEL 1:

Use httpx.

Fetch HTML.

Parse content using BeautifulSoup/lxml.

Remove unnecessary elements:

- script
- style
- nav where appropriate
- footer where appropriate
- advertisements
- tracking elements
- cookie banners
- hidden elements

Extract:

- title
- meta description
- headings
- paragraphs
- lists
- meaningful article/documentation content
- links
- canonical URL

Convert useful content into normalized text/markdown.

LEVEL 2:

If the HTTP response does not contain meaningful content because the website relies heavily on client-side JavaScript:

Use Playwright.

Render the page.

Wait for network/content readiness.

Extract visible/main content.

Do NOT use Playwright unnecessarily.

--------------------------------------------------
URL NORMALIZATION
--------------------------------------------------

Normalize URLs:

- remove fragments
- normalize trailing slash
- normalize default ports
- normalize redirects
- canonicalize where possible
- prevent duplicate URLs

Example:

https://example.com/page
https://example.com/page/
https://example.com/page#section

should not accidentally become three independent knowledge documents.

--------------------------------------------------
DEDUPLICATION
--------------------------------------------------

Generate a content hash for each page.

Example:

SHA-256(normalized_content)

If the hash has not changed since the previous crawl:

DO NOT regenerate embeddings.

Mark the page as unchanged.

--------------------------------------------------
ERROR HANDLING
--------------------------------------------------

Implement retries for transient failures.

Handle:

- timeout
- connection failure
- 403
- 404
- 429
- 500
- invalid HTML
- malformed sitemap
- redirect loops
- browser rendering failure

Do not crash the entire crawl because one page fails.

Record page-level failures.

--------------------------------------------------
CONCURRENCY
--------------------------------------------------

Use bounded concurrency.

Do NOT launch unlimited requests.

Implement a crawler concurrency limit.

The concurrency should be configurable through environment/config.

--------------------------------------------------
CRAWL JOB
--------------------------------------------------

The crawl MUST run asynchronously.

The API request should NOT wait for:

- hundreds of HTTP requests
- Playwright rendering
- chunking
- embedding generation

The API should return immediately:

{
  "crawl_id": "...",
  "status": "queued"
}

A worker performs the crawl.

--------------------------------------------------
CRAWL PIPELINE
--------------------------------------------------

Implement:

Discover URLs
      ↓
Normalize URLs
      ↓
Validate domain
      ↓
Check robots policy
      ↓
Fetch URL
      ↓
Extract content
      ↓
Clean content
      ↓
Generate content hash
      ↓
Compare with previous version
      ↓
If unchanged → skip
      ↓
If changed → save new content
      ↓
Create/update document
      ↓
Queue embedding/indexing
      ↓
Mark page processed

--------------------------------------------------
CRAWL STATES
--------------------------------------------------

Support:

QUEUED
RUNNING
COMPLETED
PARTIAL
FAILED
CANCELLED

Page states:

DISCOVERED
PROCESSING
INDEXED
UNCHANGED
FAILED
SKIPPED

--------------------------------------------------
CRAWL LIMITS
--------------------------------------------------

Implement configurable safeguards:

MAX_PAGES
MAX_DEPTH
REQUEST_TIMEOUT
MAX_CONCURRENT_REQUESTS
CRAWL_DELAY
MAX_CONTENT_SIZE

Do not allow a customer to accidentally make the crawler crawl the entire internet.

--------------------------------------------------
SECURITY
--------------------------------------------------

Validate URLs.

Prevent SSRF.

Do not allow arbitrary internal network targets such as:

localhost
127.0.0.1
0.0.0.0
169.254.169.254
private network ranges

Block non-http/https schemes.

The crawler must never be allowed to access internal infrastructure.

--------------------------------------------------
OBSERVABILITY
--------------------------------------------------

Log:

- crawl_id
- agent_id
- organization_id
- URL
- status
- latency
- extraction method
- HTTP status
- retry count
- content hash
- page size

Track:

- pages discovered
- pages processed
- pages failed
- pages unchanged
- crawl duration

--------------------------------------------------
OUTPUT
--------------------------------------------------

Produce clean normalized knowledge documents.

Each document should contain metadata such as:

{
  "source_type": "website",
  "source_url": "...",
  "canonical_url": "...",
  "title": "...",
  "organization_id": "...",
  "agent_id": "...",
  "crawl_id": "..."
}

--------------------------------------------------
TESTING
--------------------------------------------------

Create tests for:

1. simple static HTML
2. JS-rendered page
3. sitemap
4. sitemap index
5. duplicate URLs
6. redirects
7. canonical URLs
8. robots.txt
9. timeout
10. 404
11. 429
12. content unchanged
13. content changed
14. domain escape attempt
15. SSRF attempt
16. large page
17. broken HTML

--------------------------------------------------
IMPORTANT
--------------------------------------------------

Do NOT connect this to the chatbot widget yet.

Do NOT trigger crawling automatically from the frontend yet.

First make the crawler itself reliable.

At the end provide:

1. files changed
2. architecture
3. crawl state machine
4. API flow
5. worker flow
6. test results
7. example crawl output

Do not move to widget integration until this crawler is stable.
TASK 4 — Automatically Trigger Crawl When the Widget Is Embedded

Now comes your most interesting requirement.

You said:

“I put the script into my React website and it automatically scrapes the website once.”

That's possible, but do it carefully.

The flow should be:
Company creates Agent
        ↓
Company adds:
https://example.com
        ↓
Platform stores:
allowed_domain = example.com
        ↓
Company gets embed code
        ↓
They put code into website
        ↓
Widget loads
        ↓
Widget sends:
agent_id
current_site_origin
        ↓
FastAPI
        ↓
Verify origin belongs to agent
        ↓
Check:
Has initial crawl already happened?
        │
        ├── YES → do nothing
        │
        └── NO
              ↓
          Create Crawl Job
              ↓
             Redis
              ↓
          Crawl Worker
Critical detail

Do not start a new crawl every time somebody visits the website.

Otherwise:

10,000 visitors
      ↓
10,000 crawl jobs

Your infrastructure dies.

Instead:

first widget load
      ↓
crawl requested
      ↓
database says:
INITIAL_CRAWL_PENDING
      ↓
one job created
      ↓
future visitors
      ↓
do nothing

Use an idempotent operation + database constraint/distributed lock.

PROMPT
Act as a senior distributed-systems engineer.

Now connect the deployed chatbot widget to the website knowledge system.

DO NOT change the crawler implementation itself.

The requirement:

When a company embeds our chatbot into its public website for the first time, the platform should automatically initiate an initial website crawl.

Important:

The browser widget must NOT perform the actual crawling.

The widget only signals the backend.

Architecture:

Customer Website
      ↓
widget.js
      ↓
FastAPI
      ↓
validate agent + origin
      ↓
check initial crawl status
      ↓
enqueue crawl if necessary
      ↓
Redis / worker
      ↓
crawler

--------------------------------------------------
WIDGET INITIALIZATION
--------------------------------------------------

When widget.js loads:

1. identify agent_id
2. identify current site origin
3. call backend initialization endpoint

Example:

POST /api/widget/bootstrap

Payload:

{
  "agent_id": "...",
  "origin": "https://example.com"
}

--------------------------------------------------
SECURITY
--------------------------------------------------

Never trust the origin from the browser alone.

Backend must compare the origin against the allowed website configured for that agent.

If:

origin != allowed_domain

do NOT start crawl.

Return an appropriate error.

Support:

- exact domain
- optional subdomain configuration
- HTTPS

--------------------------------------------------
IDEMPOTENCY
--------------------------------------------------

This is critical.

Suppose 100 customers visit the website at the same time.

The backend must NOT create 100 crawl jobs.

Only one initial crawl may be active.

Use database state and/or a distributed Redis lock.

States:

NOT_STARTED
QUEUED
RUNNING
COMPLETED
FAILED

If status is:

QUEUED
RUNNING
COMPLETED

do not create another initial crawl.

If FAILED:

allow retry according to controlled retry policy.

--------------------------------------------------
BOOTSTRAP RESPONSE
--------------------------------------------------

Return something similar to:

{
  "agent_id": "...",
  "widget_ready": true,
  "knowledge_status": "processing"
}

The widget should NOT wait for the crawl.

The user should be able to chat only according to the existing knowledge availability policy.

--------------------------------------------------
IMPORTANT PRODUCT BEHAVIOR
--------------------------------------------------

If the website has not finished crawling yet:

The chatbot should remain usable.

Example response:

"Your knowledge base is still being prepared. Some answers may be limited during initial setup."

Do not block the website.

--------------------------------------------------
NO REPEATED CRAWLS
--------------------------------------------------

The widget must not trigger a crawl on every page view.

Example:

Visitor 1 → starts initial crawl
Visitor 2 → no crawl
Visitor 3 → no crawl
Visitor 1000 → no crawl

--------------------------------------------------
MULTI-TENANCY
--------------------------------------------------

Ensure:

organization_id
agent_id
allowed_domain

are always associated.

No agent should ever access another organization's crawl state.

--------------------------------------------------
TESTS
--------------------------------------------------

Test:

1. first widget load
2. second widget load
3. 100 concurrent widget loads
4. valid origin
5. invalid origin
6. same agent on different domain
7. already crawled website
8. crawl in progress
9. failed crawl
10. retry

Do not modify unrelated chatbot behavior.

At the end provide:

- files changed
- endpoint behavior
- idempotency strategy
- concurrency strategy
- security validation
- tests
TASK 5 — Re-Crawl When Website Changes

This directly handles your:

“I scraped it today. Two months later the company updates the website.”

Correct architecture:

             Website
                │
          initial crawl
                │
                ▼
          content_hash
                │
                ▼
          indexed content

Later:

Company Dashboard
      ↓
"Re-crawl Website"
      ↓
New CrawlRun
      ↓
Fetch pages
      ↓
Calculate hashes
      ↓
Compare
      ↓
Only changed pages
      ↓
Re-embed changed content
      ↓
Keep unchanged embeddings

This is far more efficient than rebuilding the whole vector database every time.

PROMPT
Act as a senior backend engineer specializing in incremental data pipelines.

Implement incremental website re-crawling.

Do not redesign the crawler.

Requirement:

A company may crawl:

https://example.com

today.

Two months later the website changes.

The company should be able to return to the dashboard and click:

"Re-crawl Website"

The system should determine what actually changed.

Flow:

Manual Re-crawl
      ↓
Crawl Run
      ↓
Discover pages
      ↓
Fetch pages
      ↓
Normalize content
      ↓
Generate content_hash
      ↓
Compare with stored hash
      ↓
┌───────────────────────┐
│ unchanged             │ → skip
│ changed               │ → reprocess
│ new page              │ → process
│ removed page          │ → mark inactive
└───────────────────────┘

IMPORTANT:

Do not regenerate embeddings for unchanged content.

Only re-embed changed/new content.

For changed content:

old document
      ↓
mark old version inactive
      ↓
create/update new version
      ↓
chunk
      ↓
embed
      ↓
index

For removed pages:

mark them inactive.

Do not immediately hard-delete historical crawl records.

Maintain crawl history for observability.

Add:

- crawl version
- crawl timestamp
- content hash
- previous hash
- change status

Expose:

POST /api/knowledge/websites/{id}/recrawl

GET /api/knowledge/websites/{id}/runs

GET /api/knowledge/websites/{id}/changes

Dashboard should be able to show:

New pages
Changed pages
Removed pages
Unchanged pages

Do not modify unrelated functionality.

Implement tests for:

- unchanged page
- changed page
- new page
- removed page
- concurrent recrawl request
- duplicate recrawl request
TASK 6 — Connect Website Content to RAG

Only after crawler + ingestion are stable.

PROMPT
Act as a senior AI backend engineer.

Connect the website knowledge pipeline to the existing RAG system.

Do not rewrite the RAG architecture unnecessarily.

The desired pipeline:

Website
 ↓
Crawler
 ↓
Normalized Document
 ↓
Chunking
 ↓
Embedding
 ↓
Vector Index
 ↓
Metadata
 ↓
Retriever
 ↓
Agent
 ↓
LLM
 ↓
Answer

Every chunk must retain metadata:

- organization_id
- agent_id
- knowledge_source_id
- document_id
- source_url
- title
- crawl_id

CRITICAL:

Every retrieval query MUST filter by organization_id and agent_id.

Cross-tenant retrieval must be impossible.

When the user asks:

"What's your return policy?"

the system should retrieve relevant website chunks.

The response should preferably expose the source URL/citation metadata.

Implement:

1. website document ingestion
2. chunking
3. embeddings
4. vector indexing
5. retriever integration
6. metadata filtering
7. source attribution

If the project already uses pgvector/Supabase, prefer that for the MVP.

Do not introduce another vector database unless the current architecture actually requires it.

Test:

- relevant retrieval
- irrelevant retrieval
- empty retrieval
- multi-tenant isolation
- multiple agents in same organization
- changed website content
- deleted/inactive content
TASK 7 — Test “Can My Bot Handle Many Documents?”

This is another thing your senior wants.

You shouldn't just upload:

2 PDFs

and say:

“RAG works.”

You need to test increasingly large knowledge bases.

Test levels
10 documents
↓
50
↓
100
↓
500
↓
1,000

Measure:

ingestion time
embedding time
storage
retrieval latency
LLM latency
total response latency
memory
CPU
concurrent requests
PROMPT
Act as a senior performance engineer.

Stress-test the current RAG system using progressively larger knowledge bases.

Do not change product behavior.

Create a benchmark plan for:

10 documents
50 documents
100 documents
500 documents
1000 documents

Measure:

1. ingestion time
2. chunk count
3. embedding throughput
4. database size
5. vector search latency
6. retrieval latency
7. LLM latency
8. total response latency
9. memory usage
10. CPU usage
11. concurrent chat requests
12. failure rate

Test both:

single-user traffic
and
concurrent traffic.

Identify:

- bottlenecks
- database indexes missing
- expensive queries
- synchronous work
- unnecessary repeated embeddings
- slow retrieval
- memory-heavy operations

Do not prematurely introduce microservices.

First optimize the current architecture.

Provide:

benchmark results
bottleneck analysis
recommendations
before/after metrics where possible
TASK 8 — Deployment Across React / Next.js / HTML / Shopify

Now the deployment experience.

Your core embed should be JavaScript-based, because HTML, React and Next.js can all ultimately load JavaScript.

Basic HTML
<script
  src="https://cdn.yourplatform.com/widget.js"
  data-agent-id="agent_123">
</script>
React
<script
  src="https://cdn.yourplatform.com/widget.js"
  data-agent-id="agent_123"
/>

Or dynamically load it.

Next.js

Use a Script component or equivalent client-side loading mechanism.

Shopify

This requires a Shopify-specific integration path rather than pretending Shopify is just arbitrary HTML. You would eventually want a Shopify app/theme integration or supported script/app-extension mechanism.

PROMPT
Act as a senior frontend/platform engineer.

Build the production embed system.

Goal:

A business creates an AI agent and receives a small embed snippet.

Example:

<script
  src="https://cdn.yourplatform.com/widget.js"
  data-agent-id="agent_123">
</script>

The same chatbot backend should work regardless of whether the customer's site is:

- HTML
- JavaScript
- React
- Next.js
- Vue
- other JavaScript-based websites

The widget must:

1. load asynchronously
2. avoid blocking the host website
3. isolate styles
4. avoid CSS conflicts
5. use the configured agent
6. initialize securely
7. open/close smoothly
8. communicate with FastAPI
9. support streaming responses
10. handle errors
11. support responsive layouts

Use Shadow DOM or another robust style-isolation strategy where appropriate.

The widget should not expose secret API keys.

Only public agent configuration should be exposed to the browser.

Implement:

GET /api/agents/{agent_id}/public-config

or equivalent.

The backend must validate that the agent is published and enabled.

Also create documentation/examples for:

HTML
React
Next.js

Do not implement Shopify-specific authentication yet.

Only make the widget architecture extensible for future platform integrations.
TASK 9 — Knowledge Gap Detection

This is your product differentiator.

Your existing project documentation already defines the product around Knowledge Gap Detection: conversations → evaluation → grouping similar failures → dashboard recommendations.

Flow
Customer Question
       ↓
Retrieval
       ↓
LLM Answer
       ↓
Conversation stored
       ↓
Async Evaluation
       ↓
Was answer sufficiently supported?
       ↓
YES → normal conversation
       ↓
NO
       ↓
Gap Candidate
       ↓
Semantic clustering
       ↓
Repeated topic
       ↓
Knowledge Gap
PROMPT
Act as a senior AI evaluation engineer.

Implement the Knowledge Gap Detection layer.

Do not modify normal chat latency.

The evaluation MUST happen asynchronously.

Chat request:

User
 ↓
RAG
 ↓
LLM
 ↓
Response
 ↓
Return response immediately
 ↓
Store evaluation job

Then:

Background Worker
 ↓
Evaluate retrieval
 ↓
Evaluate grounding
 ↓
Evaluate answer quality
 ↓
Analyze negative feedback
 ↓
Detect failure candidate
 ↓
Semantic clustering
 ↓
Knowledge Gap

Use multiple signals:

low retrieval relevance
insufficient evidence
unsupported answer
explicit "I don't know"
repeated user question
thumbs down
human escalation
repeated similar failures

Do NOT define a knowledge gap from one failed request alone.

Aggregate repeated failures.

Example:

Question 1:
Can I change delivery address?

Question 2:
Can I modify shipping address?

Question 3:
Can I redirect my order?

Question 4:
Can the courier change my address?

These should potentially become:

Delivery Address Changes

The system should store:

topic
occurrence count
sample questions
confidence
retrieval metrics
user feedback
first seen
last seen
status

Return the gap to the dashboard.

Do not perform expensive clustering synchronously during chat requests.


---

# TASK 10 — Production Hardening

Finally:

```text
security
rate limits
logging
monitoring
retry
timeouts
dead-letter jobs
database indexes
connection pooling
CDN
load testing
tenant isolation
PROMPT
Act as a Principal Production Engineer preparing the application for real-world traffic.

Audit the completed crawler + RAG + widget system.

Focus on:

1. SSRF protection
2. tenant isolation
3. authentication
4. authorization
5. API rate limiting
6. crawler rate limiting
7. Redis locks
8. idempotency
9. database indexing
10. connection pooling
11. retry policies
12. timeout policies
13. job failure handling
14. dead-letter strategy
15. structured logging
16. request IDs
17. observability
18. metrics
19. resource limits
20. memory usage
21. browser worker limits
22. Playwright process cleanup
23. duplicate embedding prevention
24. vector query performance
25. API latency
26. widget failure isolation

Do not change business functionality.

Only harden reliability, security, performance and maintainability.

Produce a production-readiness report with:

CRITICAL
HIGH
MEDIUM
LOW

and fix the critical/high issues.
The Most Important Design Decision

I want you to remember this because your senior may ask you about it:

Don't think of the feature as:

“The chatbot scrapes the website.”

Think of it as:

“The platform maintains a website-backed knowledge source.”

That's a much better architecture.

              KNOWLEDGE SOURCE
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Website    Sitemap     Documents
          │
          ↓
       Crawler
          │
          ↓
      Normalizer
          │
          ↓
       Documents
          │
          ↓
       Chunking
          │
          ↓
      Embeddings
          │
          ↓
      Vector Index
          │
          ↓
          RAG
          │
          ↓
       AI Agent

Then the widget simply consumes that knowledge.

And your “one-time scrape” idea becomes this
First deployment
Company enters:

https://acme.com

        ↓

Platform saves website

        ↓

Company embeds widget

        ↓

Widget bootstraps

        ↓

Backend checks:

Initial crawl exists?
        │
        ├── No
        │    ↓
        │  enqueue
        │    ↓
        │  crawl
        │
        └── Yes
             ↓
          do nothing
Two months later
Company Dashboard

       ↓

[Re-crawl Website]

       ↓

Crawl Run

       ↓

Compare content hashes

       ↓

┌──────────┬──────────┬──────────┐
│ New      │ Changed  │ Same     │
│ pages    │ pages    │ pages    │
└────┬─────┴────┬─────┴────┬─────┘
     ↓          ↓          ↓
  index       re-index    skip

That is the architecture I would defend in a senior engineering discussion.

One more important optimization

Don't make the crawler depend on Playwright for every page.

Use:

HTTP fetch → parse → done
                  │
                  └── if JS-heavy → Playwright

That single decision can make a massive difference when a customer's website has hundreds or thousands of pages.

And I would keep your current modular-monolith architecture for the MVP rather than immediately splitting crawler, chat, RAG, analytics and evaluation into separate microservices. Your own RAG project documentation already points toward asynchronous heavy work, stateless API instances, tenant isolation and avoiding premature distributed complexity.

Start with Task 0. Let Antigravity audit the current code first. After it gives you the audit, use Task 1, then Task 2, and so on. Do not give it all ten prompts at once.