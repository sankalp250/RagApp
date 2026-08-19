"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp } from "@/lib/animation";
import { Activity, TrendingUp, Sparkles } from "lucide-react";

const TAGS = [
  { name: "Order Tracking", count: "+38%" },
  { name: "Returns Policy", count: "+45%" },
  { name: "Shipping Times", count: "+29%" },
  { name: "B2B Invoicing", count: "+18%" },
  { name: "Product Specs", count: "+52%" },
  { name: "Promo Codes", count: "+12%" },
  { name: "API Docs", count: "+34%" },
  { name: "Warranty Claims", count: "+22%" },
];

const TIME_RANGES = ["3 days", "1 week", "1 month", "3 months", "6 months", "1 year"];

export function AnalyticsShowcase() {
  const [selectedRange, setSelectedRange] = useState("1 week");
  const [activeTagIndex, setActiveTagIndex] = useState(0);

  // Auto-cycle through time ranges and highlight tags
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedRange((prev) => {
        const nextIdx = (TIME_RANGES.indexOf(prev) + 1) % TIME_RANGES.length;
        return TIME_RANGES[nextIdx];
      });
      setActiveTagIndex((prev) => (prev + 1) % TAGS.length);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="analytics" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="DEEP CONVERSATIONAL INSIGHTS (LIVE REPORTING)"
        title="Advanced Analytics and"
        highlightText="Continuous Reporting"
        description="Gain complete visibility into customer questions, response latencies, escalation rates, and high-frequency topics across all channels."
      />

      {/* 2-Column Analytics Layout (Matching Reference Video Frame 10s) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Card: Topic Cloud & Keyword Performance */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-bold text-slate-900">Topic Performance</h3>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Live Clusters
              </span>
            </div>

            {/* Bubble Pill Container */}
            <div className="flex flex-wrap gap-2.5 py-4">
              {TAGS.map((tag, idx) => {
                const isHighlight = activeTagIndex === idx;
                return (
                  <motion.span
                    key={tag.name}
                    animate={{
                      scale: isHighlight ? 1.08 : 1,
                      borderColor: isHighlight ? "#6366f1" : "rgba(226, 232, 240, 0.8)",
                      backgroundColor: isHighlight ? "#eef2ff" : "#f8fafc",
                    }}
                    transition={{ duration: 0.3 }}
                    className="px-4 py-2 rounded-full border text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs cursor-default"
                  >
                    <span className={isHighlight ? "text-indigo-900 font-bold" : ""}>
                      #{tag.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {tag.count}
                    </span>
                  </motion.span>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated across 128,430 conversations</span>
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Auto-Categorized
            </span>
          </div>
        </motion.div>

        {/* Right Card: Optimizing Performance with Time Filter and Chart */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
              <h3 className="text-xl font-bold text-slate-900">Optimizing Performance</h3>

              {/* Time Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-semibold overflow-x-auto no-scrollbar">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      selectedRange === range
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Blocks + Trend Chart */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
                  Engagement Rate
                </span>
                <span className="text-3xl font-black tracking-tight font-display mt-1 block">
                  +39%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
                  Resolution Speed
                </span>
                <span className="text-3xl font-black tracking-tight font-display mt-1 block">
                  +54%
                </span>
              </div>
            </div>

            {/* Trend SVG Graphic */}
            <div className="h-28 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                <line x1="0" y1="25" x2="400" y2="25" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Growth Trend Line */}
                <polyline
                  points="0,85 80,60 160,75 240,40 320,50 400,10"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="60" r="4" fill="#ec4899" />
                <circle cx="240" cy="40" r="4" fill="#ec4899" />
                <circle cx="400" cy="10" r="5" fill="#ec4899" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Latency: 1.42s avg</span>
            <span>Automated: 87.6%</span>
            <span>Satisfaction: 4.6/5</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
