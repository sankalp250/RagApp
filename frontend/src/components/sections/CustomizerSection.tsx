"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sliders, Sparkles, Bot, Check, Send } from "lucide-react";
import { fadeUp } from "@/lib/animation";

const THEMES = [
  { id: "purple", name: "Purple Neon", color: "bg-indigo-600", gradient: "from-indigo-600 to-purple-600" },
  { id: "blue", name: "Electric Blue", color: "bg-blue-600", gradient: "from-blue-600 to-cyan-600" },
  { id: "emerald", name: "Emerald Mint", color: "bg-emerald-600", gradient: "from-emerald-600 to-teal-600" },
  { id: "orange", name: "Sunset Amber", color: "bg-amber-500", gradient: "from-amber-500 to-orange-600" },
  { id: "rose", name: "Vibrant Rose", color: "bg-pink-600", gradient: "from-pink-600 to-rose-600" },
];

const STYLES = ["Modern Rounded", "Glassmorphism", "Bubble Pill", "Minimal Clean"];
const AVATARS = [
  { id: "orb", name: "Abstract Orb", emoji: "✨" },
  { id: "bot", name: "Friendly Bot", emoji: "🤖" },
  { id: "agent", name: "Specialist", emoji: "👩‍💼" },
  { id: "spark", name: "Core AI", emoji: "🔮" },
];

export function CustomizerSection() {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi there! 👋 How can I help you accelerate your business today?"
  );

  // Auto-cycle themes and avatars smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedTheme((prev) => {
        const nextIdx = (THEMES.findIndex((t) => t.id === prev.id) + 1) % THEMES.length;
        return THEMES[nextIdx];
      });
      setSelectedAvatar((prev) => {
        const nextIdx = (AVATARS.findIndex((a) => a.id === prev.id) + 1) % AVATARS.length;
        return AVATARS[nextIdx];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="BRANDING & CUSTOMIZATION (AUTO-CYCLING)"
        title="Customize Every Detail to Match"
        highlightText="Your Brand Identity"
        description="Tailor the colors, avatar, tone of voice, welcome greetings, and widget layout to blend seamlessly with your company website design."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Customizer Controls Panel */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6"
        >
          {/* 1. Theme Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
              Theme Palette
            </label>
            <div className="flex items-center gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white transition-all cursor-pointer ${
                    selectedTheme.id === t.id
                      ? "ring-4 ring-indigo-500/30 scale-110 shadow-md"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {selectedTheme.id === t.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Container Style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
              Widget Style
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedStyle === style
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Avatar Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
              Agent Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedAvatar.id === av.id
                      ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-2xl block mb-1">{av.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-700 block truncate">
                    {av.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Welcome Message */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Welcome Greeting
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </motion.div>

        {/* Right: Live Interactive Widget Preview */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:col-span-6 flex justify-center"
        >
          <div className="w-full max-w-sm rounded-[32px] bg-white border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
            {/* Dynamic Header */}
            <div
              className={`p-4 bg-gradient-to-r ${selectedTheme.gradient} text-white flex items-center justify-between transition-all duration-500`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-sm">
                  {selectedAvatar.emoji}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Acme Assistant</h4>
                  <p className="text-[11px] text-white/80">Active · Auto-Theme Live</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-white/80" />
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 bg-slate-50/60 min-h-[220px]">
              {/* Dynamic Welcome Message */}
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-slate-800 text-xs shadow-xs border border-slate-200/60 leading-relaxed rounded-bl-none">
                  {welcomeMessage}
                </div>
              </div>

              {/* Sample User Question */}
              <div className="flex flex-col items-end">
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-white text-xs shadow-xs leading-relaxed rounded-br-none bg-gradient-to-r ${selectedTheme.gradient}`}
                >
                  Can you recommend the best plan for a team of 15?
                </div>
              </div>

              {/* Sample Bot Response */}
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-slate-800 text-xs shadow-xs border border-slate-200/60 leading-relaxed rounded-bl-none">
                  For 15 team members, our Growth tier offers unlimited knowledge indexing, 10 agent routers, and dedicated Slack sync!
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Type your question..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-100 rounded-full border-none text-slate-500"
              />
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedTheme.gradient} text-white flex items-center justify-center shadow-md`}
              >
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
