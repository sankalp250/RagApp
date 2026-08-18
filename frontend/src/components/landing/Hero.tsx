"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, Cpu, Code2, Bot, Send, ThumbsUp, ThumbsDown, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function Hero() {
  // Live Chat Simulator State
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hi there! 👋 How can I help you today?" },
    { role: "user", text: "Can I change my delivery address after shipment?" },
    {
      role: "assistant",
      text: "Yes, you can update your delivery address within 24 hours of dispatch. Please contact our live team or update it directly from your order dashboard.",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Our knowledge base has answered this! You can easily configure and customize this flow in seconds.";
      if (text.toLowerCase().includes("return") || text.toLowerCase().includes("policy")) {
        reply = "You can return items within 30 days of delivery. Items must be unused and in original packaging.";
      } else if (text.toLowerCase().includes("pricing") || text.toLowerCase().includes("cost")) {
        reply = "We offer a 14-day free trial, followed by scalable plans starting at $29/mo.";
      }

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Luminous Radial Glows */}
      <div className="orb-purple w-[550px] h-[550px] top-10 left-1/2 -translate-x-1/2 -z-10 opacity-70" />
      <div className="orb-pink w-[400px] h-[400px] top-32 left-10 -z-10 opacity-50" />
      <div className="orb-blue w-[450px] h-[450px] top-20 right-10 -z-10 opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tagline Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-indigo-200/60 dark:border-indigo-800/40 text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-500/10">
            <Sparkles className="w-4 h-4 text-purple-600 animate-spin-slow" />
            <span>AI Chatbot Platform for Modern Businesses</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-4xl mx-auto mb-6"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1] sm:leading-[1.1]">
            Build AI Chatbots that{" "}
            <span className="gradient-text-purple">Understand</span>,{" "}
            <span className="gradient-text-purple">Engage</span> &amp;{" "}
            <span className="gradient-text-hero">Improve.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            The all-in-one platform to build, customize, embed, and monitor intelligent RAG chatbots that learn continuously from real user queries.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/register">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto shadow-xl shadow-indigo-500/25" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start Building Free
            </Button>
          </Link>
          <Link href="#analytics">
            <Button variant="glass" size="lg" className="w-full sm:w-auto gap-2" leftIcon={<Play className="w-4 h-4 fill-current text-indigo-600" />}>
              View Live Demo
            </Button>
          </Link>
        </motion.div>

        {/* Value Prop Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-16 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>No Coding Required</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Enterprise Guardrails</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Hybrid pgvector RAG</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Self-Healing Knowledge</span>
          </div>
        </motion.div>

        {/* Centerpiece 3D Glass Dashboard & Live Chat Sandbox */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Outer Glow Halo */}
          <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl -z-10" />

          {/* Main Glassmorphic Showcase Canvas */}
          <div className="glass-panel rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-white/80 dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Columns: Interactive SaaS Analytics Dashboard Preview */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Dashboard Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-slate-800/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    C
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Analytics Overview</h4>
                    <p className="text-[11px] text-slate-500">Live Agent Intelligence Matrix</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    May 1 - May 31
                  </span>
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <p className="text-[11px] font-medium text-slate-500">Total Chats</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">128,430</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    ↑ 23.5%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <p className="text-[11px] font-medium text-slate-500">Unique Users</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">45,892</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    ↑ 18.2%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <p className="text-[11px] font-medium text-slate-500">Resolution</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">87.6%</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    ↑ 11.3%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <p className="text-[11px] font-medium text-slate-500">Avg Latency</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">1.42s</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    ↓ 6.2%
                  </span>
                </div>
              </div>

              {/* Conversations Over Time SVG Chart */}
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Conversations &amp; Knowledge Volume
                  </span>
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                    Live Real-time
                  </span>
                </div>
                {/* Visual Spline Curve */}
                <div className="h-32 w-full relative flex items-end">
                  <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,90 Q50,40 100,70 T200,30 T300,50 T400,15 L400,120 L0,120 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M0,90 Q50,40 100,70 T200,30 T300,50 T400,15"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Pulsing Highlight Dot */}
                    <circle cx="400" cy="15" r="5" fill="#a855f7" className="animate-ping" />
                    <circle cx="400" cy="15" r="5" fill="#a855f7" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                  <span>May 1</span>
                  <span>May 8</span>
                  <span>May 15</span>
                  <span>May 22</span>
                  <span>May 31</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Simulated Chat Widget */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xl overflow-hidden flex flex-col h-[460px]">
                
                {/* Chat Widget Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-sm">
                        🤖
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold leading-none">Support Assistant</h5>
                      <span className="text-[11px] opacity-80">Online &bull; Knowledge Verified</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/25 text-white font-medium">
                    Demo Mode
                  </span>
                </div>

                {/* Message Stream Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-none"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Prompts */}
                <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => handleSendMessage("What are your return policies?")}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap transition-colors"
                  >
                    Return policies?
                  </button>
                  <button
                    onClick={() => handleSendMessage("How much does it cost?")}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap transition-colors"
                  >
                    Pricing info?
                  </button>
                </div>

                {/* Message Input Box */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a question..."
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
