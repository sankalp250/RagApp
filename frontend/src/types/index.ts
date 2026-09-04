export interface AgentMetric {
  totalConversations: number;
  uniqueUsers: number;
  resolutionRate: number;
  avgResponseTime: number;
  knowledgeHealth: number;
  fallbackRate: number;
}

export interface KnowledgeGapItem {
  id: string;
  topic: string;
  occurrences: number;
  successfulAnswers: number;
  avgRelevance: number;
  dissatisfactionRate: number;
  status: "Needs Attention" | "In Review" | "Resolved";
  sampleQuestions: string[];
  suggestedAction: string;
  recommendedTopics: string[];
}

export interface CrawledPage {
  url: string;
  title: string;
  chunks: number;
  status: "pending" | "crawling" | "chunked" | "indexed";
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: "E-Commerce" | "Communication" | "Helpdesk" | "Documents" | "Custom";
  icon: string;
  description: string;
  status: "Connected" | "Available" | "Popular" | "Coming Soon";
  actionType: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp?: string;
  isGap?: boolean;
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionTaken?: string;
  };
}

export type ChatbotTheme = "purple" | "blue" | "emerald" | "amber" | "rose" | "dark";
export type ChatbotStyle = "modern" | "rounded" | "bubble" | "minimal";
