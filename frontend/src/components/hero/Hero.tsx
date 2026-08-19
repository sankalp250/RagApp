"use client";

import React from "react";
import { motion } from "framer-motion";
import { HeroDashboard } from "./HeroDashboard";
import { HeroFloatingWidget } from "./HeroFloatingWidget";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animation";

export function Hero() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambient Pastel Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[550px] ambient-glow-purple -z-10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] ambient-glow-pink -z-10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] ambient-glow-blue -z-10 blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-70 -z-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Top Text Container */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto mb-14 sm:mb-18"
        >
          {/* Top Pill Badge */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-indigo-100 shadow-sm text-xs font-bold text-indigo-700 mb-6 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI AGENT PLATFORM FOR MODERN BUSINESSES</span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-display"
          >
            Build AI Agents that{" "}
            <span className="text-gradient-purple">Understand, Engage</span> &{" "}
            <span className="relative inline-block">
              Improve.
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-indigo-300/30 -z-10 rounded-full" />
            </span>
          </motion.h1>

          {/* Subtitle / Supporting text */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Create, customize, and embed powerful AI agents that understand your business, take action through connected tools, and continuously discover what your AI doesn&apos;t know.
          </motion.p>

          {/* Supporting Badges */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-semibold text-slate-600"
          >
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No Coding Required
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
              <Brain className="w-4 h-4 text-indigo-500" />
              Knowledge Gap Aware
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
              <Zap className="w-4 h-4 text-amber-500" />
              Sub-second Responses
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Enterprise Data Isolation
            </span>
          </motion.div>
        </motion.div>

        {/* Product Visual Container (Dashboard + Floating Widget) */}
        <div className="relative w-full max-w-5xl mx-auto pt-4">
          {/* Main Dashboard Visual */}
          <HeroDashboard />

          {/* Layered Floating Chatbot Widget */}
          <div className="lg:absolute -bottom-8 -right-6 mt-8 lg:mt-0 flex justify-center z-20">
            <HeroFloatingWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
