"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Clock, Hash, Users, Sparkles } from "lucide-react";

export function AnalyticsShowcase() {
  const [leftTab, setLeftTab] = useState<"topics" | "demographics" | "latency">("topics");
  const [timeframe, setTimeframe] = useState<"3days" | "1week" | "1month" | "3months" | "6months" | "1year">("1week");

  // Dynamic metrics matching the video progression
  const timeframeData = {
    "3days": { engagement: "+28%", growth: "+46%", startPt: "-22%", peakPt: "+42%", curve: "M0,80 Q70,95 140,75 T280,30 T400,20" },
    "1week": { engagement: "+35%", growth: "+51%", startPt: "+27%", peakPt: "-47%", curve: "M0,60 Q70,40 140,80 T280,45 T400,15" },
    "1month": { engagement: "+42%", growth: "+56%", startPt: "-32%", peakPt: "+52%", curve: "M0,75 Q70,90 140,50 T280,25 T400,10" },
    "3months": { engagement: "+50%", growth: "+61%", startPt: "-37%", peakPt: "-57%", curve: "M0,55 Q70,75 140,40 T280,60 T400,8" },
    "6months": { engagement: "+57%", growth: "+66%", startPt: "+42%", peakPt: "-62%", curve: "M0,50 Q70,30 140,70 T280,30 T400,5" },
    "1year": { engagement: "+64%", growth: "+70%", startPt: "+48%", peakPt: "-68%", curve: "M0,40 Q70,25 140,55 T280,20 T400,5" },
  };

  const current = timeframeData[timeframe];

  // Topics/Hashtags from reference
  const topicTags = [
    { name: "#Returns & Refunds", size: "lg", color: "border-indigo-300 text-indigo-700 bg-indigo-50/70" },
    { name: "#Product Specs", size: "md", color: "border-pink-300 text-pink-700 bg-pink-50/70" },
    { name: "#AI Integration", size: "lg", color: "border-purple-300 text-purple-700 bg-purple-50/70" },
    { name: "#Account Access", size: "sm", color: "border-amber-300 text-amber-700 bg-amber-50/70" },
    { name: "#Billing Support", size: "md", color: "border-emerald-300 text-emerald-700 bg-emerald-50/70" },
    { name: "#API Docs", size: "lg", color: "border-blue-300 text-blue-700 bg-blue-50/70" },
    { name: "#Order Tracking", size: "sm", color: "border-purple-300 text-purple-700 bg-purple-50/70" },
    { name: "#Security & GDPR", size: "md", color: "border-indigo-300 text-indigo-700 bg-indigo-50/70" },
    { name: "#Fast Answers", size: "sm", color: "border-pink-300 text-pink-700 bg-pink-50/70" },
    { name: "#Self-Healing", size: "md", color: "border-amber-300 text-amber-700 bg-amber-50/70" },
  ];

  const demographics = [
    { label: "Enterprise Users", pct: 74, color: "bg-indigo-500" },
    { label: "Developers & Engineers", pct: 58, color: "bg-purple-500" },
    { label: "Customer Support Teams", pct: 48, color: "bg-pink-500" },
    { label: "Product Managers", pct: 42, color: "bg-amber-500" },
    { label: "Growth Marketers", pct: 36, color: "bg-emerald-500" },
    { label: "E-Commerce Merchants", pct: 25, color: "bg-sky-500" },
  ];

  return (
    <section id="analytics" className="py-24 relative overflow-hidden bg-slate-50/60 dark:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Interactive Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            Advanced Analytics and Reporting
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Real-time conversational observability that pinpoints user intentions and automatically identifies knowledge gaps.
          </p>
        </div>

        {/* 2 Interactive Showcase Cards (Exact Layout from Video) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Card: Dynamic Sub-views (Topics, Demographics, Latency) */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              {/* Header with Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {leftTab === "topics" && "Topic & Keyword Intelligence"}
                    {leftTab === "demographics" && "Audience Demographics"}
                    {leftTab === "latency" && "Average Response Time"}
                  </h3>
                </div>

                {/* Sub-view switcher */}
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setLeftTab("topics")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leftTab === "topics" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Topics
                  </button>
                  <button
                    onClick={() => setLeftTab("demographics")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leftTab === "demographics" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Audience
                  </button>
                  <button
                    onClick={() => setLeftTab("latency")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leftTab === "latency" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Latency
                  </button>
                </div>
              </div>

              {/* Body Content depending on Left Tab */}
              <div className="py-6 min-h-[280px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {leftTab === "topics" && (
                    <motion.div
                      key="topics"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap gap-2.5 items-center justify-center"
                    >
                      {topicTags.map((tag, idx) => (
                        <motion.span
                          key={idx}
                          whileHover={{ scale: 1.08, y: -2 }}
                          className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition-all ${tag.color}`}
                        >
                          {tag.name}
                        </motion.span>
                      ))}
                    </motion.div>
                  )}

                  {leftTab === "demographics" && (
                    <motion.div
                      key="demographics"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full space-y-3.5"
                    >
                      {demographics.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>{item.label}</span>
                            <span>{item.pct}%</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.08 }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {leftTab === "latency" && (
                    <motion.div
                      key="latency"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="w-full relative"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500">Peak Resolution Time</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          ⚡ 1.25s Avg (pgvector cached)
                        </span>
                      </div>
                      <div className="h-44 w-full relative">
                        <svg viewBox="0 0 400 140" className="w-full h-full">
                          <path
                            d="M0,100 Q100,20 200,90 T400,30"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          {/* Marker Callout */}
                          <g transform="translate(140, 35)">
                            <rect width="64" height="24" rx="12" fill="#0f172a" />
                            <text x="32" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                              0:07 min
                            </text>
                          </g>
                          <circle cx="172" cy="65" r="5" fill="#ea580c" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2">
                        <span>Oct</span>
                        <span>Mar</span>
                        <span>Jul</span>
                        <span>Aug</span>
                        <span>Sep</span>
                        <span>Nov</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              Aggregated across all ingested knowledge documents and customer conversation sessions.
            </p>
          </div>

          {/* Right Card: Optimizing Performance (Exact Interactive Replicating Video) */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              {/* Header with Timeframe Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Optimizing Performance
                </h3>

                {/* Timeframe Selector Pills */}
                <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                  {(["3days", "1week", "1month", "3months", "6months", "1year"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-xl transition-all ${
                        timeframe === tf
                          ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-sm scale-105"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {tf === "3days" && "3 days"}
                      {tf === "1week" && "1 week"}
                      {tf === "1month" && "1 month"}
                      {tf === "3months" && "3 months"}
                      {tf === "6months" && "6 months"}
                      {tf === "1year" && "1 year"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2 Animated Highlight Badges + Spline Graph */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-6 items-center">
                
                {/* Yellow & Pink Impact Boxes */}
                <div className="sm:col-span-5 space-y-3">
                  {/* Yellow Box: Engagement */}
                  <motion.div
                    key={`eng-${timeframe}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-400 text-slate-950 shadow-md"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Engagement Rate
                    </p>
                    <p className="text-3xl font-black tracking-tight mt-1">
                      {current.engagement}
                    </p>
                  </motion.div>

                  {/* Pink Box: Followers / Resolved */}
                  <motion.div
                    key={`grow-${timeframe}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Resolution Rate
                    </p>
                    <p className="text-3xl font-black tracking-tight mt-1">
                      {current.growth}
                    </p>
                  </motion.div>
                </div>

                {/* Pink Spline Curve Graph */}
                <div className="sm:col-span-7 h-44 relative bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-3 flex flex-col justify-between border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-400">
                    <span className="text-slate-800 dark:text-slate-200">{current.startPt}</span>
                    <span className="text-pink-600">{current.peakPt}</span>
                  </div>

                  <div className="flex-1 w-full relative">
                    <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                      <motion.path
                        key={`path-${timeframe}`}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                        d={current.curve}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Baseline</span>
                    <span>AI Optimized</span>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              Live feedback telemetry blended directly with semantic grounding scores.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
