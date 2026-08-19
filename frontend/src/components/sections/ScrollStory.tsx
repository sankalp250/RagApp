"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Bot,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Layers,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";

const STORY_STEPS = [
  {
    step: "01",
    title: "Connect Knowledge",
    tagline: "Enter your website URL or upload documents",
    color: "from-blue-600 to-indigo-600",
    accentBg: "bg-blue-50 text-blue-600 border-blue-200",
    icon: Globe,
    badgeText: "Instant Ingestion",
    details: {
      heading: "Automatic Sitemap & Document Parser",
      stats: "94 Pages Indexed · 2,438 Semantic Chunks",
      desc: "Our crawler recursively indexes your documentation, product catalog, and help centers with zero manual formatting.",
      mockItem: "https://yourcompany.com/docs → Parsed in 42 seconds",
      mockList: [
        { title: "/documentation/api", detail: "Indexed (28 chunks)" },
        { title: "/help/shipping-policy", detail: "Indexed (14 chunks)" },
        { title: "/pricing/enterprise", detail: "Indexed (8 chunks)" },
      ],
    },
  },
  {
    step: "02",
    title: "Hybrid RAG Engine",
    tagline: "Dense vector embeddings combined with BM25 keyword search",
    color: "from-indigo-600 to-purple-600",
    accentBg: "bg-purple-50 text-purple-600 border-purple-200",
    icon: Search,
    badgeText: "Sub-100ms Retrieval",
    details: {
      heading: "Cross-Encoder Re-Ranking Pipeline",
      stats: "99.4% Context Precision · Zero Hallucinations",
      desc: "Queries are semantically matched, reranked for precision, and assembled with strict grounding rules before reaching the LLM.",
      mockItem: "User: 'Warranty policy' → Top 3 high-confidence chunks retrieved",
      mockList: [
        { title: "Query Vector", detail: "[0.841, -0.192, 0.431, ...]" },
        { title: "BM25 Sparse Score", detail: "Match: 99.8%" },
        { title: "Cross-Encoder Rerank", detail: "Top 3 chunks cited" },
      ],
    },
  },
  {
    step: "03",
    title: "Action Router",
    tagline: "Agents don't just chat — they execute authenticated actions",
    color: "from-purple-600 to-pink-600",
    accentBg: "bg-pink-50 text-pink-600 border-pink-200",
    icon: Bot,
    badgeText: "Multi-Tool Execution",
    details: {
      heading: "Live API Tool Calling (Shopify, Slack, CRM)",
      stats: "87.6% Autonomous Resolution Rate",
      desc: "When customers ask about order status, subscriptions, or bug reports, the agent directly invokes live APIs with guarded safety checks.",
      mockItem: "Shopify API: Found Order #8491 (Shipped via FedEx)",
      mockList: [
        { title: "Shopify API Tool", detail: "Executed in 120ms" },
        { title: "Slack Hand-off", detail: "Summary & sentiment attached" },
        { title: "Custom Webhook", detail: "200 OK Returned" },
      ],
    },
  },
  {
    step: "04",
    title: "Knowledge Gaps",
    tagline: "Your AI continuously reveals what it doesn't know",
    color: "from-pink-600 to-rose-600",
    accentBg: "bg-rose-50 text-rose-600 border-rose-200",
    icon: AlertTriangle,
    badgeText: "Self-Improving AI",
    details: {
      heading: "Semantic Clustering of Unanswered Inquiries",
      stats: "143 Unanswered Questions Grouped",
      desc: "Detects low-confidence answers, dissatisfaction signals, and automatically synthesizes a ready-to-publish FAQ or documentation article.",
      mockItem: "Gap Alert: 'Delivery Address Modification Policy' needs documentation",
      mockList: [
        { title: "Gap Topic", detail: "Address change during transit" },
        { title: "Failed Queries", detail: "143 instances clustered" },
        { title: "AI Draft", detail: "Article ready to publish" },
      ],
    },
  },
];

export function ScrollStory() {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);

  // Smooth auto-advancing progress loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoPlayProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((step) => (step + 1) % STORY_STEPS.length);
          return 0;
        }
        return prev + 2.5; // ~4 seconds total per step
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const current = STORY_STEPS[activeStep];
  const IconComponent = current.icon;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/40 my-16 rounded-[44px] max-w-7xl mx-auto border border-indigo-100 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.08)]">
      {/* Background Ambient Pastel Glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] ambient-glow-purple -z-10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] ambient-glow-pink -z-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-xs text-xs font-bold text-indigo-600 mb-4">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>HOW CHATIN POWERS YOUR BUSINESS (AUTO-PLAYING)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-display">
            The Complete AI Agent Lifecycle in{" "}
            <span className="text-gradient-purple">4 Seamless Steps</span>
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            From raw documents to autonomous tool execution and automated knowledge gap healing.
          </p>
        </div>

        {/* Step Selector Pills with Auto-Play Progress Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
          {STORY_STEPS.map((item, idx) => (
            <button
              key={item.step}
              onClick={() => {
                setActiveStep(idx);
                setAutoPlayProgress(0);
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
                activeStep === idx
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs"
              }`}
            >
              {activeStep === idx && (
                <div
                  className="absolute bottom-0 left-0 top-0 bg-white/20 -z-0 transition-all duration-100"
                  style={{ width: `${autoPlayProgress}%` }}
                />
              )}
              <span
                className={`text-xs font-bold relative z-10 ${
                  activeStep === idx ? "text-indigo-200" : "text-indigo-600"
                }`}
              >
                {item.step}
              </span>
              <span className="relative z-10">{item.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Interactive Stage Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.step}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="p-6 sm:p-10 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-indigo-500/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Stage Info */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl font-black font-display text-gradient-purple">
                    {current.step}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${current.accentBg}`}>
                    {current.badgeText}
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {current.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {current.details.desc}
                </p>

                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{current.details.stats}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs font-mono text-indigo-900 font-semibold">
                    {current.details.mockItem}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveStep((prev) => (prev + 1) % STORY_STEPS.length);
                      setAutoPlayProgress(0);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    Auto-advancing: Stage {activeStep + 1} of {STORY_STEPS.length}
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Stage Graphic */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200/80 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {current.details.heading}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  {/* Stage-specific visual card items */}
                  <div className="space-y-2.5 text-xs">
                    {current.details.mockList.map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-700">{item.title}</span>
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.detail}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Sparkles className="w-3 h-3" /> Live Engine Verification
                    </span>
                    <span className="font-mono text-slate-400">Lat: 28ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
