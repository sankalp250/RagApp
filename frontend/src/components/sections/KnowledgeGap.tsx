"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PillButton } from "@/components/ui/PillButton";
import {
  AlertTriangle,
  Brain,
  Sparkles,
  CheckCircle2,
  FileEdit,
  TrendingDown,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { KNOWLEDGE_GAPS_MOCK } from "@/lib/data";

export function KnowledgeGap() {
  const [activeGapIndex, setActiveGapIndex] = useState(0);
  const [draftGenerated, setDraftGenerated] = useState(true);

  // Auto-cycle through knowledge gaps continuously so visitors see the complete intelligence loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGapIndex((prev) => (prev + 1) % KNOWLEDGE_GAPS_MOCK.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentGap = KNOWLEDGE_GAPS_MOCK[activeGapIndex];

  const handleGenerateDraft = () => {
    setDraftGenerated(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <section id="knowledge-gaps" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative">
      {/* Background Pastel Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] ambient-glow-pink -z-10 blur-3xl pointer-events-none" />

      <SectionHeading
        badge="OUR CORE DIFFERENTIATOR ⭐ (AUTO-PLAYING DEMO)"
        title="Your AI Tells You What"
        highlightText="It Doesn't Know."
        description="We don't just provide an AI chatbot. We monitor live conversations, automatically cluster repeated unanswered questions, pinpoint missing knowledge, and draft the exact articles you need to fix them."
      />

      {/* Flagship Showcase Card (Refined Light Mode Glassmorphism) */}
      <div className="rounded-[40px] bg-white/95 backdrop-blur-2xl border border-rose-200/90 shadow-[0_30px_70px_-20px_rgba(244,63,94,0.12)] p-6 sm:p-10 relative overflow-hidden">
        {/* Top Highlight Badge Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rose-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Knowledge Gap Intelligence Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  Auto-Detecting Gaps
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentGap.occurrences} customer queries failed due to missing documentation
              </p>
            </div>
          </div>

          {/* Gap Switcher */}
          <div className="flex items-center gap-2">
            {KNOWLEDGE_GAPS_MOCK.map((gap, idx) => (
              <button
                key={gap.id}
                onClick={() => setActiveGapIndex(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeGapIndex === idx
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Gap #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Step Visual Story: Conversation -> Detection -> Recommended Article */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
          {/* Step 1: Failed Conversation */}
          <div className="p-5 rounded-3xl bg-slate-50/70 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                1. Customer Interaction
              </span>
              {/* User Bubble */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 font-semibold mb-3 rounded-br-none shadow-2xs">
                &ldquo;Can I change my delivery address after my order has shipped?&rdquo;
              </div>
              {/* Bot Fallback Bubble */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 font-medium leading-relaxed rounded-bl-none shadow-2xs">
                &ldquo;I&apos;m not sure based on the available documentation.&rdquo;
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Low Confidence & Dissatisfaction Logged</span>
            </div>
          </div>

          {/* Step 2: Semantic Clustering & Metrics */}
          <div className="p-5 rounded-3xl bg-slate-50/70 border border-slate-200/80 shadow-xs space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Semantic Clustering & Metrics
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block">Occurrences</span>
                <span className="text-xl font-bold text-slate-900 font-display">{currentGap.occurrences}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-rose-700 block">Success Rate</span>
                <span className="text-xl font-bold text-rose-700 font-display">{currentGap.successfulAnswers}%</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                Similar Queries Clustered:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 font-mono">
                {currentGap.sampleQuestions.slice(0, 3).map((q, i) => (
                  <li key={i} className="truncate bg-white p-2 rounded-xl border border-slate-200/60">
                    • &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 3: AI Recommended Article Generation */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-pink-50/40 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  3. Automated Resolution
                </span>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>

              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Suggested Knowledge Article
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {currentGap.suggestedAction}
              </p>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Outline:
                </span>
                <ul className="text-xs text-indigo-900 font-medium space-y-1.5">
                  {currentGap.recommendedTopics.slice(0, 3).map((t, i) => (
                    <li key={i} className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-indigo-100">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <PillButton
              variant="primary"
              size="sm"
              icon={<FileEdit className="w-3.5 h-3.5" />}
              onClick={handleGenerateDraft}
              className="w-full"
            >
              Draft Article Generated! ✓
            </PillButton>
          </div>
        </div>

        {/* Drafted Article Preview */}
        <AnimatePresence>
          {draftGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Ready to Publish to Knowledge Base
                  </span>
                </div>
                <span className="text-xs text-indigo-700 font-bold bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                  Estimated Accuracy Lift: +6.4%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-indigo-100 text-xs font-mono text-slate-800 space-y-2 shadow-2xs">
                <p className="font-bold text-sm text-slate-900 font-sans">
                  Title: Order Delivery Address Modification & Rerouting Policy
                </p>
                <p className="text-slate-600 leading-relaxed font-sans text-xs">
                  Customers may modify their shipping address freely before dispatch via the self-service portal. Once the package has been handed over to FedEx/DHL, an official carrier redirect request must be filed through our automated support agent with a $5 re-consignment fee.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
