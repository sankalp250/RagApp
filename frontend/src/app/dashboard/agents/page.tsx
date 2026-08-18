"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, Plus, ArrowRight, Settings, Sparkles, Shield, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, Agent } from "@/lib/api";

export default function AgentsListPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "agent-1",
      name: "Customer Support Assistant",
      description: "Primary support bot handling returns, shipping, and FAQs.",
      organization_id: "org-1",
      public_key: "pk_live_support_12345",
      primary_model: "gemini-2.5-flash",
      fallback_model: "groq/qwen-qwq-32b",
      system_prompt: "You are an expert customer support agent for Acme Corp.",
      temperature: 0.2,
      max_tokens: 1024,
      top_k_chunks: 5,
      similarity_threshold: 0.65,
      is_active: true,
      widget_theme: {
        primaryColor: "#6366F1",
        style: "modern",
        position: "bottom-right",
        welcomeMessage: "Hi there! 👋 How can I help you today?",
        showAvatar: true,
        showTypingIndicator: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "agent-2",
      name: "Sales & Product Guide",
      description: "Recommends products, compares plans, and assists checkout.",
      organization_id: "org-1",
      public_key: "pk_live_sales_67890",
      primary_model: "gemini-2.5-flash",
      fallback_model: "groq/qwen-qwq-32b",
      system_prompt: "You are an enthusiastic sales advisor for Acme Corp.",
      temperature: 0.3,
      max_tokens: 1024,
      top_k_chunks: 4,
      similarity_threshold: 0.7,
      is_active: true,
      widget_theme: {
        primaryColor: "#EC4899",
        style: "rounded",
        position: "bottom-right",
        welcomeMessage: "Hello! Looking for the best plan for your team?",
        showAvatar: true,
        showTypingIndicator: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    api.getAgents().then((res) => {
      if (res && res.length > 0) setAgents(res);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Agents</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your autonomous RAG chatbots, custom prompts, and widget themes.
          </p>
        </div>

        <Link href="/dashboard/agents/new">
          <Button variant="gradient" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <Badge variant={agent.is_active ? "success" : "default"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {agent.description || "No description provided."}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> Primary Model</span>
                  <span className="font-semibold text-slate-200">{agent.primary_model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-pink-400" /> Fallback Model</span>
                  <span className="font-semibold text-slate-200">{agent.fallback_model}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center gap-3">
              <Link href={`/dashboard/agents/${agent.id}/customize`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<Settings className="w-3.5 h-3.5" />}>
                  Customize Widget
                </Button>
              </Link>
              <Link href={`/dashboard/deploy`}>
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 hover:text-white" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
