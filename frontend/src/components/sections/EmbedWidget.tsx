"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Code2, Copy, Check, Sparkles, Bot, Globe } from "lucide-react";
import { fadeUp } from "@/lib/animation";

export function EmbedWidget() {
  const [copied, setCopied] = useState(false);

  const codeSnippet = `<script
  src="https://cdn.chatin.ai/widget.js"
  data-agent-id="agent_9842fae"
  data-theme="light"
  data-position="bottom-right"
  async
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="widget" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="ZERO-EFFORT DEPLOYMENT"
        title="One Line of Code."
        highlightText="Your AI Agent Everywhere."
        description="Embed the lightweight 18kb JavaScript widget on any HTML website, Next.js, Shopify store, Webflow, or WordPress site with instant live updates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Code Snippet Box (Clean Light Glass) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-5"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                HTML Embed Tag
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-all cursor-pointer border border-indigo-100"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4.5 rounded-2xl bg-slate-900 text-indigo-200 font-mono text-xs sm:text-[13px] overflow-x-auto leading-relaxed shadow-inner">
            {codeSnippet}
          </pre>

          <div className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Lightweight bundle (~18KB gzipped)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Zero dependencies · Non-blocking async load</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Custom domain whitelisting & CSP security included</span>
            </div>
          </div>
        </motion.div>

        {/* Right: Simulated Customer Website Preview with floating widget */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 rounded-[36px] bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-7 relative overflow-hidden"
        >
          {/* Mock Browser Header */}
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200/80 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 max-w-xs mx-auto py-1 px-3 rounded-full bg-white text-[11px] text-slate-600 font-mono text-center truncate border border-slate-200/80 shadow-2xs font-semibold">
              https://acme-store.com
            </div>
          </div>

          {/* Website Mockup Content */}
          <div className="space-y-4 opacity-85">
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
            <div className="h-24 w-full bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs">
              <div className="h-4 w-1/2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded mb-2" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-white border border-slate-100 rounded-xl shadow-2xs" />
              <div className="h-20 bg-white border border-slate-100 rounded-xl shadow-2xs" />
            </div>
          </div>

          {/* Floating Widget In Bottom Right with pulse */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="p-2.5 rounded-2xl bg-white border border-indigo-100 shadow-xl text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <span>Need help? Chat with us</span>
            </motion.div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
