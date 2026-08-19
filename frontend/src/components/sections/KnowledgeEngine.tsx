"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Database,
  ArrowRight,
} from "lucide-react";
import { fadeUp } from "@/lib/animation";

const RAG_STAGES = [
  {
    id: "query",
    title: "1. Query Expansion",
    subtitle: "Hypothetical Embeddings (HyDE)",
    desc: "Transforms ambiguous customer questions into semantic search terms and intent vectors.",
    badge: "Semantic Intent",
    color: "from-blue-500 to-indigo-500",
    detail: "User query: 'Do you ship to Germany?' → Expanded to include EU customs, DHL express rates, delivery transit times.",
  },
  {
    id: "hybrid",
    title: "2. Hybrid Retrieval",
    subtitle: "Dense Vectors + BM25 Keywords",
    desc: "Combines 1536-dim dense vector embeddings with exact keyword BM25 scoring for 100% precision.",
    badge: "Dual-Engine Index",
    color: "from-indigo-600 to-purple-600",
    detail: "Searches across 2,400+ indexed chunks in 18ms. Dense vectors catch concepts; BM25 catches exact part numbers and codes.",
  },
  {
    id: "rerank",
    title: "3. Re-Ranking",
    subtitle: "Cross-Encoder Score",
    desc: "Filters out low-relevance noise, ranking the top 3 purest context chunks for the agent.",
    badge: "99.4% Precision",
    color: "from-purple-600 to-pink-500",
    detail: "Cross-encoder scoring evaluates chunk relevance in relation to the query, discarding outdated or marginal paragraphs.",
  },
  {
    id: "synthesis",
    title: "4. Grounded Synthesis",
    subtitle: "Streaming AI Agent",
    desc: "Streams a factual, conversational answer strictly cited from your business knowledge base.",
    badge: "Zero Hallucinations",
    color: "from-emerald-500 to-teal-600",
    detail: "Generates high-speed streaming answer with source citations and triggers connected tools when actions are required.",
  },
];

export function KnowledgeEngine() {
  const [selectedStage, setSelectedStage] = useState(0);

  // Auto-cycle stages continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedStage((prev) => (prev + 1) % RAG_STAGES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="knowledge-engine" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="PRECISION RAG INFRASTRUCTURE (AUTO-PLAYING)"
        title="Sub-second Hybrid Retrieval with"
        highlightText="Zero Hallucinations"
        description="Our multi-stage RAG architecture combines dense vector similarity, BM25 sparse keyword matching, and cross-encoder re-ranking to deliver precise, trusted answers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Interactive Pipeline Stages */}
        <div className="lg:col-span-6 space-y-3.5 flex flex-col justify-between">
          {RAG_STAGES.map((stage, idx) => (
            <motion.div
              key={stage.id}
              onClick={() => setSelectedStage(idx)}
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-[24px] border transition-all cursor-pointer ${
                selectedStage === idx
                  ? "bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {stage.title}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedStage === idx
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {stage.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-600 mb-1">{stage.subtitle}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{stage.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Right Stage Deep-Dive Visualizer (Clean Light Glass) */}
        <div className="lg:col-span-6 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 text-slate-900 border border-indigo-100 shadow-xl shadow-indigo-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">
                      Live Retrieval Pipeline Inspector
                    </span>
                  </div>
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/80 font-bold">
                    Latency: 38ms
                  </span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  {RAG_STAGES[selectedStage].title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {RAG_STAGES[selectedStage].detail}
                </p>

                {/* Grounding Box */}
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 font-sans font-semibold">
                    <span>Verified Knowledge Citation:</span>
                    <span className="text-emerald-600 font-bold">Grounded</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-700 leading-relaxed border border-slate-200/70">
                    &ldquo;Standard international express shipping delivers in 3-5 business days. Return shipping is free when initiated within 30 days of delivery date.&rdquo;
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-indigo-700 pt-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Vector Similarity: 0.962 · Cross-Encoder Score: 0.988</span>
                  </div>
                </div>
              </div>

              {/* Bottom Feature Badges */}
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Semantic Chunk Deduplication
                </span>
                <span className="font-semibold text-slate-600">pgvector & Qdrant</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
