"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Brain,
} from "lucide-react";
import { fadeUp } from "@/lib/animation";

export function ContinuousLoop() {
  const [improved, setImproved] = useState(false);

  // Auto-toggle every 4.5 seconds to show continuous health improvement
  useEffect(() => {
    const interval = setInterval(() => {
      setImproved((prev) => !prev);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const healthScore = improved ? 96 : 82;
  const strokeOffset = 251.2 - (251.2 * healthScore) / 100;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="CONTINUOUS EVALUATION LOOP (AUTO-PULSING)"
        title="Your Knowledge Health Improves with"
        highlightText="Every Interaction"
        description="Traditional chatbots decay over time as your product evolves. Chatin continuously evaluates responses, detects out-of-date documentation, and prompts your team with high-impact fixes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Health Gauge Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-5"
        >
          <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 text-center space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Knowledge Base Health
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {improved ? "Optimal (96%)" : "Good (82%)"}
              </span>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Dynamic Progress Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={improved ? "stroke-emerald-500" : "stroke-indigo-600"}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: strokeOffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={healthScore}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-extrabold text-slate-900 font-display"
                >
                  {healthScore}%
                </motion.span>
                <span className="text-xs text-slate-500 font-medium">Health Rating</span>
              </div>
            </div>

            {/* Status explanation */}
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {improved
                ? "✨ 3 Knowledge gaps resolved! Model confidence elevated to 96% with zero hallucinations."
                : "14 knowledge gaps detected in the last 7 days. Automatic clustering suggests 3 article updates."}
            </p>

            {/* Interactive Toggle Button */}
            <button
              onClick={() => setImproved(!improved)}
              className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${improved ? "rotate-180" : ""}`} />
              <span>{improved ? "Reset Simulation (82%)" : "Simulate Gap Resolution (96%)"}</span>
            </button>
          </div>
        </motion.div>

        {/* Right: Closed-Loop Architecture Steps */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              01
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Real-Time Evaluation</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Every conversation is scored for retrieval relevance, sentiment, and user satisfaction.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
              02
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Semantic Clustering</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Unanswered questions with similar semantic vectors are grouped into actionable topics.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-pink-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
              03
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">AI Content Drafting</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-generates recommended documentation with verified answers ready for team review.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
              04
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Automated Knowledge Indexing</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                New documentation is instantly chunked and indexed into vector memory without re-deployments.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
