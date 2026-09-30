"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Plus,
  Sliders,
  Code2,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { ARCHETYPE_LIST } from "@/types/chatbot-studio";
import { api } from "@/lib/api";

interface AgentRecord {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model?: string;
  llm_provider?: string;
  model_name?: string;
  status?: string;
  created_at?: string;
}




const TEMPLATES = ARCHETYPE_LIST.map((arch) => ({
  id: arch.archetype,
  name: arch.name,
  category: arch.description?.split("—")[1]?.trim() || arch.description || "",
  desc: arch.description || "",
  previewColor: arch.previewColor || "#6366f1",
  primaryGradient: arch.theme.primaryGradient,
  icon: Bot,
  badge: null as string | null,
  avatar: arch.modules.welcomeHeader.avatar,
  agentName: arch.behavior.agentName,
}));

// Mark first as most popular
if (TEMPLATES[0]) TEMPLATES[0].badge = "Most Popular";
if (TEMPLATES[5]) TEMPLATES[5].badge = "Commerce";
if (TEMPLATES[6]) TEMPLATES[6].badge = "Support";




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
            {loading && agents.length === 0 ? "..." : agents.length}
          </span>
        </h3>

        {loading && agents.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 space-y-5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                  <div className="w-14 h-5 rounded-full bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-2/3 bg-slate-100 rounded-md" />
                  <div className="h-3.5 w-full bg-slate-100 rounded-md" />
                  <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                  <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
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

                  {/* Interactive Model Switcher */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">AI Model:</span>
                      <span className="text-[10px] text-slate-400">Click to switch</span>
                    </div>
                    <div className="relative">
                      <select
                        value={bot.model || bot.model_name || "gemini-2.5-flash"}
                        onChange={async (e) => {
                          const newModel = e.target.value;
                          setAgents((prev) =>
                            prev.map((a) => (a.id === bot.id ? { ...a, model: newModel } : a))
                          );
                          try {
                            await api.patch(`/agents/${bot.id}`, { model: newModel });
                          } catch (err) {
                            console.error("Failed to update model", err);
                          }
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                      >
                        <optgroup label="Google Gemini">
                          <option value="gemini-2.5-flash">✦ Gemini 2.5 Flash (Recommended)</option>
                          <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (2M Context)</option>
                        </optgroup>
                        <optgroup label="OpenAI">
                          <option value="gpt-4o-mini">⚡ GPT-4o Mini (Fast & Precise)</option>
                          <option value="gpt-4o">👑 GPT-4o Flagship</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/dashboard/chatbots/new?agent_id=${bot.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-xs font-bold text-indigo-700 text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs group"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure in Studio</span>
                  </Link>
                  <Link
                    href={`/dashboard/chatbots/new?agent_id=${bot.id}&tab=embed`}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
                    className="h-24 w-full rounded-2xl p-4 flex flex-col justify-between shadow-sm mb-4"
                    style={{ background: tmpl.primaryGradient }}
                  >
                    <div className="flex items-center justify-between">
                      {tmpl.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                          {tmpl.badge}
                        </span>
                      )}
                      <div className="ml-auto text-xl">{(tmpl as any).avatar || "🤖"}</div>
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      Agent: {(tmpl as any).agentName || "AI Assistant"}
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
