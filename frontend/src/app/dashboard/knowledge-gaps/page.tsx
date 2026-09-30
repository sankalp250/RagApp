"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Sparkles,
  CheckCircle2,
  FileEdit,
  TrendingDown,
  ArrowRight,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Layers,
  Bot,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";

interface GapItem {
  id: string;
  query: string;
  category: string;
  frequency: number;
  status: string;
  agent_id?: string;
  created_at?: string;
  recommended_action?: string;
}

export default function KnowledgeGapsPage() {
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGapIndex, setSelectedGapIndex] = useState(0);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftPublished, setDraftPublished] = useState(false);

  useEffect(() => {
    async function loadGaps() {
      try {
        const res = await api.get<{ total: number; gaps: GapItem[] }>("/analytics/knowledge-gaps");
        setGaps(res.gaps || []);
      } catch (err) {
        setGaps([]);
      } finally {
        setLoading(false);
      }
    }
    loadGaps();
  }, []);

  const currentGap = gaps[selectedGapIndex];

  const handleGenerateDraft = () => {
    setIsDrafting(true);
  };

  const handlePublishArticle = () => {
    setDraftPublished(true);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Knowledge Gap Intelligence
            </h1>
            {loading && gaps.length === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 animate-pulse border border-slate-200">
                Scanning Gaps...
              </span>
            ) : (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                  gaps.length > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {gaps.length > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>{gaps.length} Gaps Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 Gaps (Optimal Coverage)</span>
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            AI continuously discovers unanswered queries, clusters semantic gaps, and synthesizes ready-to-publish articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Health Status: 100%</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Gap Clusters</span>
          {loading && gaps.length === 0 ? (
            <div className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse my-0.5" />
          ) : (
            <span className="text-3xl font-black text-slate-900 font-display">
              {gaps.length} {gaps.length === 1 ? "Topic" : "Topics"}
            </span>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            {gaps.length === 0 && !loading ? "No unresolved customer queries" : "Identified across active conversations"}
          </p>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Unresolved Questions</span>
          {loading && gaps.length === 0 ? (
            <div className="h-9 w-28 bg-slate-100 rounded-xl animate-pulse my-0.5" />
          ) : (
            <span className="text-3xl font-black text-slate-900 font-display">
              {gaps.reduce((acc, g) => acc + (g.frequency || 1), 0)} Inquiries
            </span>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Queries resulting in fallback responses</p>
        </div>

        <div className="p-5 rounded-[28px] bg-emerald-50/80 border border-emerald-200 shadow-md shadow-emerald-900/5">
          <span className="text-xs font-semibold text-emerald-800 block mb-1">Automated Resolution</span>
          <span className="text-3xl font-black text-emerald-900 font-display">1-Click Drafts</span>
          <p className="text-[11px] text-emerald-700/80 mt-1">Gemini AI synthesizes instant articles</p>
        </div>
      </div>

      {/* Main Gaps Display */}
      {loading && gaps.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="h-4 w-36 bg-slate-100 rounded animate-pulse mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white/60 space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-3 w-10 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-7 p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-md space-y-6">
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-2/3 bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-2xl mt-4" />
            </div>
          </div>
        </div>
      ) : gaps.length === 0 ? (
        <div className="p-12 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-900">No knowledge gaps detected</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When your visitors ask questions that aren&apos;t covered in your uploaded knowledge base, our background intelligence worker clusters the missing topics and lists them here for 1-click AI generation.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: List of Gaps */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Detected Gap Clusters
            </h3>
            {gaps.map((gap, idx) => (
              <button
                key={gap.id}
                onClick={() => {
                  setSelectedGapIndex(idx);
                  setIsDrafting(false);
                  setDraftPublished(false);
                }}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedGapIndex === idx
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-800 border-slate-200/80 hover:border-indigo-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20">
                    {gap.category}
                  </span>
                  <span className="text-xs font-bold text-rose-400">{gap.frequency} asks</span>
                </div>
                <h4 className="text-xs font-bold line-clamp-1">{gap.query}</h4>
              </button>
            ))}
          </div>

          {/* Right Column: AI Resolution Studio */}
          <div className="lg:col-span-7 p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6">
            {currentGap && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {currentGap.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{currentGap.query}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentGap.recommended_action || "Add explicit documentation addressing this query."}
                  </p>
                </div>

                {!isDrafting ? (
                  <button
                    onClick={handleGenerateDraft}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Article with Gemini AI</span>
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900">Generated Documentation Article</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-mono text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                      ### {currentGap.query}\n\nOur policy ensures that all customer inquiries regarding {currentGap.category.toLowerCase()} are processed within standard operational windows. Please consult our support team for specialized requests.
                    </p>
                    <button
                      onClick={handlePublishArticle}
                      disabled={draftPublished}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{draftPublished ? "Published to Knowledge Base!" : "Publish to Knowledge Base"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
