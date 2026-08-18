"use client";

import React from "react";
import { UploadCloud, Palette, Code, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      title: "Upload Knowledge",
      desc: "Drag and drop PDFs, DOCX, CSVs or website URLs. Our hybrid chunking pipeline indexes everything instantly.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      num: "02",
      icon: Palette,
      title: "Customize & Brand",
      desc: "Choose colors, avatar, fonts, positioning, and persona prompts to match your brand identity perfectly.",
      gradient: "from-indigo-600 to-purple-600",
    },
    {
      num: "03",
      icon: Code,
      title: "Embed Anywhere",
      desc: "Paste a single lightweight <script> tag or iframe into Shopify, WordPress, Webflow, or custom React apps.",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      num: "04",
      icon: MessageSquare,
      title: "Engage Visitors",
      desc: "Deliver streaming, highly accurate answers grounded in your data with strict guardrails and low latency.",
      gradient: "from-pink-600 to-rose-600",
    },
    {
      num: "05",
      icon: Sparkles,
      title: "Self-Improve",
      desc: "Detect knowledge gaps automatically. Generate 1-click AI content drafts to close gaps and get smarter.",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>5-Step Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            From raw documents to an autonomous self-improving AI agent in under 3 minutes.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.gradient} text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-700">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
