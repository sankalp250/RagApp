"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PillButton } from "@/components/ui/PillButton";
import {
  Globe,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  Search,
  RefreshCw,
} from "lucide-react";
import { fadeUp } from "@/lib/animation";

const MOCK_PAGES = [
  { url: "https://acme.io/", title: "Home & Platform Overview", chunks: 32, status: "indexed" },
  { url: "https://acme.io/pricing", title: "Subscription Tiers & Enterprise SLA", chunks: 18, status: "indexed" },
  { url: "https://acme.io/faq", title: "Frequently Asked Questions", chunks: 45, status: "indexed" },
  { url: "https://acme.io/shipping-returns", title: "International Shipping & Return Terms", chunks: 24, status: "indexed" },
  { url: "https://acme.io/docs/api", title: "Developer API & Webhook Specifications", chunks: 56, status: "indexed" },
  { url: "https://acme.io/support", title: "Escalation & SLA Guidelines", chunks: 19, status: "indexed" },
];

export function WebsiteCrawler() {
  const [urlInput, setUrlInput] = useState("https://acme-store.com");
  const [progress, setProgress] = useState(65);
  const [crawlingIndex, setCrawlingIndex] = useState(3);

  // Auto-crawling continuous loop so visitor sees live progress automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 20 : prev + 15));
      setCrawlingIndex((prev) => (prev + 1) % MOCK_PAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="crawler" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="INSTANT KNOWLEDGE INGESTION"
        title="Your Website is Already Your"
        highlightText="AI Knowledge Base"
        description="Enter any website URL or upload internal documentation. Our crawler automatically maps sitemaps, extracts clean text, splits semantic chunks, and builds high-dimensional vector embeddings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Interactive Control Panel */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Website URL
                </label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Auto-Crawling Live
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200/80 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Globe className="w-4 h-4 text-indigo-500 ml-2 shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Ingestion Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Continuous Sync Progress</span>
                <span className="text-indigo-600 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Document Types Supported */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Supported Ingestion Sources:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {["PDF Documents", "DOCX / Word", "CSV / Tables", "Notion Wikis", "Markdown"].map((type) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50/60 text-indigo-900 font-semibold flex items-center gap-1.5 border border-indigo-100/60"
                  >
                    <FileText className="w-3 h-3 text-indigo-600" />
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <span className="text-2xl font-bold text-indigo-900 font-display">2,438</span>
              <p className="text-xs font-semibold text-indigo-700 mt-0.5">Semantic Chunks Synced</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-2xl font-bold text-emerald-900 font-display">94</span>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">Pages Live & Grounded</p>
            </div>
          </div>
        </motion.div>

        {/* Right Live Crawl Stream Mockup (Clean Light Glass Browser) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-7"
        >
          <div className="rounded-[36px] bg-white text-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-900/5 border border-slate-200/80 relative overflow-hidden">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-slate-500 font-medium">
                  crawler_worker_01 · active
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                Multi-Vector Indexing
              </span>
            </div>

            {/* Live Indexed Pages List */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {MOCK_PAGES.map((page, idx) => {
                const isCurrentlyActive = crawlingIndex === idx;
                return (
                  <motion.div
                    key={page.url}
                    animate={{
                      scale: isCurrentlyActive ? 1.02 : 1,
                      backgroundColor: isCurrentlyActive ? "rgba(238, 242, 255, 0.8)" : "rgba(248, 250, 252, 0.8)",
                      borderColor: isCurrentlyActive ? "#818cf8" : "rgba(226, 232, 240, 0.8)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="p-3.5 rounded-2xl border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{page.title}</h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{page.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-white text-indigo-700 font-bold text-[10px] border border-indigo-100 shadow-2xs">
                        {page.chunks} chunks
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Ingestion Summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Automated recursive crawling enabled</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 100% Hallucination Proof
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
