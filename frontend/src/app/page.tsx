"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/hero/Hero";
import { ScrollStory } from "@/components/sections/ScrollStory";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WebsiteCrawler } from "@/components/sections/WebsiteCrawler";
import { KnowledgeEngine } from "@/components/sections/KnowledgeEngine";
import { AgentRouter } from "@/components/sections/AgentRouter";
import { KnowledgeGap } from "@/components/sections/KnowledgeGap";
import { ContinuousLoop } from "@/components/sections/ContinuousLoop";
import { AnalyticsShowcase } from "@/components/sections/AnalyticsShowcase";
import { CustomizerSection } from "@/components/sections/CustomizerSection";
import { Integrations } from "@/components/sections/Integrations";
import { EmbedWidget } from "@/components/sections/EmbedWidget";
import { SecurityScale } from "@/components/sections/SecurityScale";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Top Floating Pill Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* Section 1 & 2: Hero with Live Dashboard & Floating Chat Widget */}
        <Hero />

        {/* Section 3: Scroll-Driven Storytelling (Expanding Viewport matching Video) */}
        <ScrollStory />

        {/* Section 4: How It Works (Numbered Cards 01-05 & Stat Callouts) */}
        <HowItWorks />

        {/* Section 5: Website Crawling & Instant Ingestion */}
        <WebsiteCrawler />

        {/* Section 6: Precision RAG & Hybrid Retrieval Pipeline */}
        <KnowledgeEngine />

        {/* Section 7: AI Agent Multi-Tool Router (Shopify, Slack, Gmail, APIs) */}
        <AgentRouter />

        {/* Section 8: Ecosystem Integrations */}
        <Integrations />

        {/* Section 9: ⭐ Flagship Knowledge Gap Intelligence */}
        <KnowledgeGap />

        {/* Section 10: Continuous Learning Loop & Health Gauge */}
        <ContinuousLoop />

        {/* Section 11: Advanced Analytics & Topic Cloud */}
        <AnalyticsShowcase />

        {/* Section 12: Real-time Chatbot Customizer */}
        <CustomizerSection />

        {/* Section 13: 1-Line Embeddable Widget */}
        <EmbedWidget />

        {/* Section 14: Enterprise Security & Data Isolation */}
        <SecurityScale />

        {/* Section 15: Accordion FAQ */}
        <FAQSection />

        {/* Section 16: Closing CTA Banner */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
