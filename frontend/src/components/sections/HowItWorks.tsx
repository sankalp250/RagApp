"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { ArrowRight, Database, Bot, PlugZap, Code2, Sparkles, CheckCircle2 } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animation";

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Connect Knowledge",
    subtitle: "Website & Documents",
    desc: "Crawl your public website URL or upload PDF, DOCX, CSV and Notion exports in seconds.",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500",
    icon: Database,
  },
  {
    num: "02",
    title: "Create Your Agent",
    subtitle: "Custom Personality & Guardrails",
    desc: "Define agent instructions, tone of voice, security guardrails, and retrieval sensitivity.",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500",
    icon: Bot,
  },
  {
    num: "03",
    title: "Connect Your Tools",
    subtitle: "Shopify, Slack & APIs",
    desc: "Empower your agent to look up orders, escalate tickets, and trigger real-time actions.",
    color: "from-purple-600 to-indigo-600",
    bgColor: "bg-purple-600",
    icon: PlugZap,
  },
  {
    num: "04",
    title: "Embed Anywhere",
    subtitle: "One-line Script",
    desc: "Deploy the beautiful floating chat widget on any website, Webflow, Shopify, or React app.",
    color: "from-blue-600 to-cyan-500",
    bgColor: "bg-blue-600",
    icon: Code2,
  },
  {
    num: "05",
    title: "Discover Gaps",
    subtitle: "Self-Improving Intelligence",
    desc: "Continuous evaluation clusters missing answers and recommends new knowledge articles.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500",
    icon: Sparkles,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="STEP BY STEP PROCESS"
        title="From Zero to Autonomous AI Agent in"
        highlightText="5 Simple Steps"
        description="Build, deploy and continuously improve your intelligent AI assistant without writing a single line of backend code."
      />

      {/* 5-Step Numbered Cards (Matching Reference Video Frame 18s) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-24"
      >
        {PROCESS_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:shadow-xl hover:border-indigo-200 flex flex-col justify-between transition-all"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h4>
                <p className="text-[11px] font-semibold text-slate-400 mb-4">{step.subtitle}</p>
              </div>

              {/* Colored Card Block */}
              <div
                className={`w-full h-36 rounded-2xl ${step.bgColor} p-4 text-white flex flex-col justify-between relative overflow-hidden shadow-inner group`}
              >
                {/* Background Icon */}
                <Icon className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none" />

                <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Step
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black font-display tracking-tight text-white">
                    {step.num}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed">{step.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* High-Impact Stat Callouts (Matching Reference Video Frame 22s) */}
      <div className="space-y-12 pt-8 border-t border-slate-200/80">
        {/* Stat Row 1 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6 border-b border-slate-100"
        >
          <div className="md:col-span-4 flex items-center justify-center md:justify-start">
            <div className="w-32 h-32 rounded-[28px] bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-6 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Bot className="w-16 h-16" />
            </div>
          </div>

          <div className="md:col-span-4 text-center md:text-left">
            <div className="relative inline-block">
              <MetricBadge color="orange" rotate={-6} className="absolute -top-3 left-4">
                Users
              </MetricBadge>
              <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight font-display">
                +270K
              </span>
            </div>
          </div>

          <div className="md:col-span-4 text-slate-600 text-sm sm:text-base leading-relaxed text-center md:text-left">
            RagApp&apos;s intelligent algorithms analyze customer queries in real-time, providing immediate contextual answers and continuous knowledge refinement.
          </div>
        </motion.div>

        {/* Stat Row 2 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6 border-b border-slate-100"
        >
          <div className="md:col-span-4 flex items-center justify-center md:justify-start">
            <div className="w-32 h-32 rounded-[28px] bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-6 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <PlugZap className="w-16 h-16" />
            </div>
          </div>

          <div className="md:col-span-4 text-center md:text-left">
            <div className="relative inline-block">
              <MetricBadge color="pink" rotate={-5} className="absolute -top-3 left-4">
                Resolution Speed
              </MetricBadge>
              <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight font-display">
                8X
              </span>
            </div>
          </div>

          <div className="md:col-span-4 text-slate-600 text-sm sm:text-base leading-relaxed text-center md:text-left">
            Automate 87.6% of recurring customer support and sales questions with sub-second response latency across all digital touchpoints.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
