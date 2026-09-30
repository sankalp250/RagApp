import { AgentMetric, KnowledgeGapItem, IntegrationItem, FAQItem } from "@/types";

export const HERO_METRICS = {
  totalConversations: "128,430",
  uniqueUsers: "45,892",
  resolutionRate: "87.6%",
  avgResponseTime: "1.42s",
  knowledgeHealth: "82%",
  fallbackRate: "6.2%",
};

export const RECENT_CONVERSATIONS_MOCK = [
  { id: "1", title: "How do I return a product?", time: "2m ago", status: "Resolved", tag: "Returns" },
  { id: "2", title: "Where is my order #8491?", time: "5m ago", status: "Resolved (Shopify)", tag: "Orders" },
  { id: "3", title: "Do you ship internationally?", time: "10m ago", status: "Resolved", tag: "Shipping" },
  { id: "4", title: "Can I change my delivery address?", time: "14m ago", status: "Gap Detected", tag: "Delivery" },
];

export const TOP_TOPICS_MOCK = [
  { name: "Returns & Refunds", count: "4,532", percent: 35 },
  { name: "Product Information", count: "3,984", percent: 31 },
  { name: "Shipping & Tracking", count: "2,451", percent: 19 },
  { name: "Account & Billing", count: "1,782", percent: 14 },
];

export const KNOWLEDGE_GAPS_MOCK: KnowledgeGapItem[] = [
  {
    id: "gap-1",
    topic: "Delivery Address Changes",
    occurrences: 143,
    successfulAnswers: 32,
    avgRelevance: 0.41,
    dissatisfactionRate: 38,
    status: "Needs Attention",
    sampleQuestions: [
      "Can I change my delivery address after my order has shipped?",
      "I entered the wrong zip code, can you redirect package?",
      "Can I modify delivery address after dispatch?",
      "Can the courier change the destination before arrival?",
    ],
    suggestedAction: "Create documentation article explaining shipment transit policies and carrier limits.",
    recommendedTopics: [
      "Changing address before vs after shipment",
      "Courier redirection policy",
      "Time limits for address modification",
      "Carrier fees for rerouting",
    ],
  },
  {
    id: "gap-2",
    topic: "Custom Tax Exemption for B2B",
    occurrences: 91,
    successfulAnswers: 28,
    avgRelevance: 0.38,
    dissatisfactionRate: 44,
    status: "Needs Attention",
    sampleQuestions: [
      "How do we upload our VAT exemption certificate?",
      "Are non-profit purchases exempt from sales tax?",
      "Can we get reverse charge invoicing for EU?",
    ],
    suggestedAction: "Upload B2B tax compliance guidelines and verification flow.",
    recommendedTopics: [
      "EU VAT Reverse Charge handling",
      "501(c)(3) tax exemption submission",
      "Automatic tax refund on verified orders",
    ],
  },
  {
    id: "gap-3",
    topic: "Warranty on Replacement Parts",
    occurrences: 67,
    successfulAnswers: 41,
    avgRelevance: 0.52,
    dissatisfactionRate: 29,
    status: "In Review",
    sampleQuestions: [
      "Does the 2-year warranty renew when a part is replaced?",
      "What is the warranty period for refurbished modules?",
    ],
    suggestedAction: "Clarify modular hardware warranty terms in Knowledge Base.",
    recommendedTopics: [
      "Replacement part warranty duration",
      "Original purchase timeline vs replacement timeline",
    ],
  },
];

export const INTEGRATIONS_LIST: IntegrationItem[] = [
  {
    id: "shopify",
    name: "Shopify",
    category: "E-Commerce",
    icon: "ShoppingBag",
    description: "Look up order statuses, tracking numbers, stock levels, and initiate returns automatically.",
    status: "Coming Soon",
    actionType: "Read & Execute",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    icon: "MessageSquare",
    description: "Escalate complex customer queries to internal support channels with full AI context.",
    status: "Coming Soon",
    actionType: "Notification & Hand-off",
  },
  {
    id: "gmail",
    name: "Gmail / Email",
    category: "Communication",
    icon: "Mail",
    description: "Send automated follow-up summaries, ticketing emails, and confirmation receipts.",
    status: "Coming Soon",
    actionType: "Send & Sync",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    category: "Helpdesk",
    icon: "Headphones",
    description: "Create, search, and update help tickets with conversation history and gap tags.",
    status: "Coming Soon",
    actionType: "Ticket Automation",
  },
  {
    id: "notion",
    name: "Notion",
    category: "Documents",
    icon: "FileText",
    description: "Directly sync internal team workspaces, product wikis, and SOP docs into vector memory.",
    status: "Coming Soon",
    actionType: "Knowledge Ingestion",
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "Helpdesk",
    icon: "Radio",
    description: "Integrate as an intelligent agent within your existing Intercom inbox routing.",
    status: "Coming Soon",
    actionType: "Inbox Co-pilot",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "E-Commerce",
    icon: "CreditCard",
    description: "Verify subscription tiers, customer invoices, payment methods, and receipt links.",
    status: "Coming Soon",
    actionType: "Billing Query",
  },
  {
    id: "custom-api",
    name: "Custom Webhooks",
    category: "Custom",
    icon: "Webhook",
    description: "Connect your proprietary REST/GraphQL backend APIs with authenticated agent tool calls.",
    status: "Coming Soon",
    actionType: "Custom Agent Tools",
  },
];

export const FAQ_LIST: FAQItem[] = [
  {
    question: "How does the automatic website crawler work?",
    answer: "You simply enter your website URL. Our distributed crawler discovers all accessible pages, extracts clean text (stripping headers, scripts, and ads), splits it into semantic chunks, and generates multi-vector embeddings indexed into our vector search engine in minutes.",
    category: "Ingestion",
  },
  {
    question: "What document file types can I upload?",
    answer: "We support PDF, DOCX, TXT, CSV, Markdown, Notion exports, and structured JSON. Files are automatically parsed, cleaned, OCR-processed when necessary, and linked to agent knowledge bases.",
    category: "Ingestion",
  },
  {
    question: "How does Knowledge Gap Detection work?",
    answer: "Our evaluation layer continuously monitors live customer conversations. When an agent's retrieval relevance falls below confidence thresholds or a user expresses confusion/dissatisfaction, the system clusters similar failed queries semantically, alerts you to missing topics, and generates a ready-to-publish draft article.",
    category: "Intelligence",
  },
  {
    question: "Can I connect external tools like Shopify and Slack?",
    answer: "Yes! Your AI agents are not static text repliers. They can invoke authenticated tools to query Shopify order status, look up Stripe subscriptions, escalate tickets into Slack or Zendesk, and trigger custom webhooks.",
    category: "Integrations",
  },
  {
    question: "How do I embed the chatbot into my website?",
    answer: "Add a single line of JavaScript (<script src=\".../widget.js\" data-agent-id=\"...\"></script>) into your HTML before </body>. It works seamlessly with Next.js, React, Shopify, WordPress, Webflow, and custom sites.",
    category: "Deployment",
  },
  {
    question: "Is customer data and knowledge base isolated and secure?",
    answer: "Every organization operates in strict multi-tenant isolation. Your proprietary documents and conversation logs are encrypted in transit (TLS 1.3) and at rest (AES-256) with dedicated vector collection namespaces, and are never used to train global public models.",
    category: "Security",
  },
];
