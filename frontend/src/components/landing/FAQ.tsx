"use client";

import React from "react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { HelpCircle } from "lucide-react";

export function FAQ() {
  const faqItems: AccordionItem[] = [
    {
      id: "faq-1",
      question: "How does Chatin handle vector embeddings and custom data?",
      answer: "Chatin splits your uploaded PDF, DOCX, TXT, and CSV documents into semantic chunks using adaptive sliding windows. We generate dense vector embeddings using Google Gemini Embeddings and store them in Supabase PostgreSQL with the pgvector extension for sub-50ms hybrid similarity retrieval.",
    },
    {
      id: "faq-2",
      question: "Can I manage multiple chatbots with separate knowledge bases?",
      answer: "Yes! Each Organization can create unlimited AI Agents (Chatbots). Each Agent has its own isolated knowledge base, custom system prompt, model configuration (Gemini primary with Groq Qwen fallback), and distinct public widget key.",
    },
    {
      id: "faq-3",
      question: "How does the embeddable chat widget work on external websites?",
      answer: "You can embed our lightweight widget by adding a single <script> tag or iframe snippet to your website (Shopify, WordPress, Webflow, React, HTML). The widget automatically loads your custom brand colors, avatar, position, and connects to our streaming RAG API.",
    },
    {
      id: "faq-4",
      question: "What is Knowledge Gap Intelligence and how does it work?",
      answer: "When users ask questions that your knowledge base cannot answer with high confidence (retrieval grounding score < 0.6) or when a user clicks a thumbs-down rating, Chatin automatically clusters these questions into Knowledge Gaps, calculates a severity score, and generates 1-click AI drafts to help you update your documentation.",
    },
    {
      id: "faq-5",
      question: "What happens if an AI provider experiences an outage?",
      answer: "Chatin includes production-grade Circuit Breakers. If the primary Gemini model experiences rate limits or timeouts, our fallback mechanism instantly reroutes queries to Groq Qwen with zero downtime for your end users.",
    },
  ];

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about setting up and scaling your autonomous AI agents.
          </p>
        </div>

        <Accordion items={faqItems} allowMultiple={false} />

      </div>
    </section>
  );
}
