"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { fadeUp } from "@/lib/animation";

import { useAuth } from "@/lib/auth-context";

export function CTASection() {
  const { user } = useAuth();

  return (
    <section id="cta-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-12 relative">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-[44px] bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-600 text-white p-8 sm:p-16 text-center relative overflow-hidden shadow-[0_30px_80px_-20px_rgba(99,102,241,0.35)] border border-white/30"
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-bold text-white backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>START YOUR 14-DAY FREE TRIAL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] font-display">
            Your AI Should Do More Than Answer.
          </h2>

          <p className="text-base sm:text-xl text-indigo-100 leading-relaxed max-w-2xl mx-auto font-medium">
            It should help your business continuously understand what it doesn&apos;t know. Start building your autonomous AI agent in under 3 minutes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-indigo-900 text-sm font-bold shadow-xl hover:bg-slate-50 hover:scale-102 transition-all cursor-pointer"
                >
                  <span>Go to Studio Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </Link>
                <Link
                  href="/dashboard/chatbots/new"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  <span>Launch Studio Builder</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-indigo-900 text-sm font-bold shadow-xl hover:bg-slate-50 hover:scale-102 transition-all cursor-pointer"
                >
                  <span>Start Building Free</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  <span>Sign In to Studio</span>
                </Link>
              </>
            )}
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/90 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300" /> 14-Day Full Feature Trial
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-300" /> Cancel Anytime
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
