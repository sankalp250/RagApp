"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Plus,
  Sparkles,
  Sliders,
  Code2,
  Database,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Tablet,
  Layout,
  Layers,
} from "lucide-react";
import { DEFAULT_ARCHETYPES, ChatbotArchetype } from "@/types/chatbot-studio";
import { api } from "@/lib/api";

interface AgentRecord {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  llm_provider: string;
  model_name: string;
  status?: string;
  created_at?: string;
}

const TEMPLATES = [
  {
    id: "liquid-glass",
    name: "Liquid Glass Enterprise",
    category: "SaaS & E-Commerce",
    desc: "Frosted iridescent liquid glass, purple/pink glowing gradients, floating quick-prompt chips, sub-second tool badges.",
    previewGradient: "from-indigo-600 via-purple-600 to-pink-500",
    icon: Sparkles,
    badge: "Most Popular",
  },
  {
    id: "chatia-mobile",
    name: "Chatia AI Companion",
    category: "Mobile App Assistant",
    desc: "iPhone shell, category chips, gradient action banners, recipe/checklist cards with media carousels, bottom action bar.",
    previewGradient: "from-pink-500 via-rose-500 to-fuchsia-600",
    icon: Smartphone,
    badge: "Card Stacks",
  },
  {
    id: "obsidian-glow",
    name: "Obsidian Neon Glow",
    category: "Dark Mode & Voice",
    desc: "Minimal deep cobalt/obsidian dark mode, glowing weather card, clean floating speech bubbles, Siri-style glowing audio orb.",
    previewGradient: "from-blue-700 via-indigo-900 to-slate-950",
    icon: Bot,
    badge: "Minimal Dark",
  },
  {
    id: "split-canvas",
    name: "Tablet Split-View Canvas",
    category: "iPad & Document Research",
    desc: "Dual-pane layout with left history/result cards and right conversation canvas with multi-file drop zones.",
    previewGradient: "from-sky-500 to-indigo-600",
    icon: Tablet,
    badge: "Multi-Doc",
  },
  {
    id: "editorial-grid",
    name: "ChaTin Editorial & Grid",
    category: "Neo-Brutalist & Creator",
    desc: "Soft grid paper texture, bold outlines, vibrant yellow action pills, sticker stamp cards, Playfair / serif typography.",
    previewGradient: "from-amber-400 to-yellow-500 text-black",
    icon: Layout,
    badge: "Editorial Serif",
  },
  {
    id: "pastel-lifestyle",
    name: "Pastel Social & Lifestyle",
    category: "SMM & Influencer",
    desc: "Soft pink cloud background, serif headings, checklist cards, photo collage bubbles, trending topic cards.",
    previewGradient: "from-pink-400 via-rose-300 to-amber-200 text-slate-900",
    icon: Sparkles,
    badge: "Aesthetic SMM",
  },
];

export default function ChatbotsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await api.get<AgentRecord[]>("/agents");
        setAgents(Array.isArray(data) ? data : []);
      } catch (err) {
        setAgents([]);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            AI Chatbot Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build, style, connect knowledge, and deploy any industry-level chatbot archetype.
          </p>
        </div>

        <Link
          href="/dashboard/chatbots/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Chatbot</span>
        </Link>
      </div>

      {/* Active Deployed Chatbots */}
      <div>
        <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <span>Active Deployed Chatbots</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {agents.length}
          </span>
        </h3>

        {agents.length === 0 ? (
          <div className="p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900">No active chatbots deployed yet</h4>
              <p className="text-xs text-slate-500">
                Choose one of the industry-level archetypes below to launch and style your first AI agent.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((bot) => (
              <div
                key={bot.id}
                className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-indigo-300 hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                      <Bot className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{bot.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {bot.description || "Production AI Agent"}
                  </p>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Model:</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-700">
                      {bot.model_name || "gemini-1.5-flash"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/dashboard/chatbots/new?agent_id=${bot.id}`}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </Link>
                  <Link
                    href={`/dashboard/chatbots/new?agent_id=${bot.id}&tab=embed`}
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                    title="Embed Code"
                  >
                    <Code2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archetype Template Gallery */}
      <div className="pt-6 border-t border-slate-200/80">
        <div className="mb-6">
          <h3 className="font-bold text-lg text-slate-900 font-display">
            Start from an Industry-Level Archetype
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose a foundation matching your brand aesthetic. You can customize all colors, fonts, card modules, and layouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div
                    className={`h-24 w-full rounded-2xl bg-gradient-to-r ${tmpl.previewGradient} p-4 flex flex-col justify-between shadow-xs mb-4`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        {tmpl.badge}
                      </span>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-xs">
                      {tmpl.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{tmpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tmpl.desc}</p>
                </div>

                <Link
                  href={`/dashboard/chatbots/new?preset=${tmpl.id}`}
                  className="w-full py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-xs font-bold text-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                >
                  <span>Use This Archetype</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
