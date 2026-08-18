"use client";

import React from "react";
import { BarChart3, TrendingUp, Cpu, Clock, Award, Shield } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Analytics &amp; Performance</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Detailed metrics on query volume, token usage, latency distribution, and RAG grounding scores.
        </p>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400">Total Tokens Consumed</p>
          <p className="text-2xl font-black text-white">1.84M</p>
          <p className="text-[10px] text-emerald-400">92% Gemini / 8% Groq Fallback</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400">P95 Retrieval Latency</p>
          <p className="text-2xl font-black text-white">48ms</p>
          <p className="text-[10px] text-emerald-400">Sub-50ms HNSW pgvector search</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400">Cache Hit Rate</p>
          <p className="text-2xl font-black text-white">64.2%</p>
          <p className="text-[10px] text-indigo-400">Upstash Redis semantic cache</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400">Circuit Breaker Trips</p>
          <p className="text-2xl font-black text-emerald-400">0 Trips</p>
          <p className="text-[10px] text-slate-400">100% provider availability</p>
        </div>
      </div>

      {/* Latency & Provider Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Latency Distribution (ms)</h3>
          <div className="h-44 w-full flex items-end justify-between gap-3 pt-4">
            {[
              { label: "Vector Search", height: "30%", val: "48ms", color: "bg-indigo-500" },
              { label: "Reranking", height: "20%", val: "22ms", color: "bg-purple-500" },
              { label: "LLM First Token", height: "65%", val: "410ms", color: "bg-pink-500" },
              { label: "Total Stream", height: "90%", val: "1.2s", color: "bg-emerald-500" },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-300">{bar.val}</span>
                <div style={{ height: bar.height }} className={`w-full rounded-t-xl ${bar.color}`} />
                <span className="text-[10px] text-slate-400 text-center">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Grounding Quality Signals</h3>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Retrieval Grounding Score</span>
                <span className="text-emerald-400">92%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="w-[92%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Factual Consistency (Hallucination Check)</span>
                <span className="text-indigo-400">96%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="w-[96%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">User Rating Feedback Blending</span>
                <span className="text-pink-400">88%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="w-[88%] h-full bg-pink-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
