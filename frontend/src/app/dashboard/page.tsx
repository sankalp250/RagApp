"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  ChevronRight,
  ExternalLink,
  Plus,
  MessageSquare,
  Compass,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface OverviewMetrics {
  agents_count: number;
  documents_count: number;
  chunks_count: number;
  conversations_count: number;
  unique_users_count: number;
  resolution_rate: string;
  avg_latency: string;
  knowledge_gaps_count: number;
  health_score: number;
  is_fresh_account: boolean;
  recent_conversations: Array<{
    id: string;
    title: string;
    visitor_id: string;
    status: string;
    created_at: string | null;
  }>;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const data = await api.get<OverviewMetrics>("/analytics/overview");
        setMetrics(data);
      } catch (err) {
        // Default zero state for fresh account
        setMetrics({
          agents_count: 0,
          documents_count: 0,
          chunks_count: 0,
          conversations_count: 0,
          unique_users_count: 0,
          resolution_rate: "--",
          avg_latency: "--",
          knowledge_gaps_count: 0,
          health_score: 100,
          is_fresh_account: true,
          recent_conversations: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Studio User";
  const agentsCount = metrics?.agents_count ?? 0;
  const docsCount = metrics?.documents_count ?? 0;
  const convCount = metrics?.conversations_count ?? 0;
  const uniqueUsers = metrics?.unique_users_count ?? 0;
  const isFresh = metrics?.is_fresh_account ?? true;

  return (
    <div className="space-y-8">
      {/* Page Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Welcome back, {displayName} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              All Systems Operational
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isFresh
              ? "Your new AI Studio workspace is ready. Build your first agent to begin."
              : `Here is the live performance overview across your ${agentsCount} active AI agents and ${docsCount} knowledge sources.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/chatbots/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Chatbot</span>
          </Link>
        </div>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-indigo-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Total Conversations</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {convCount.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400">
            {convCount === 0 ? "Awaiting first user session" : "Live customer sessions"}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-blue-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Unique Users</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {uniqueUsers.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400">
            {uniqueUsers === 0 ? "No visitors yet" : "Active visitors"}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-emerald-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Resolution Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {metrics?.resolution_rate || "--"}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400">
            {convCount === 0 ? "Measured upon first chat" : "Successfully resolved"}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-purple-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Avg Response Time</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {metrics?.avg_latency || "--"}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400">
            {convCount === 0 ? "Fast streaming RAG latency" : "Sub-second response"}
          </div>
        </div>
      </div>

      {/* Fresh Account Onboarding Banner */}
      {isFresh && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[36px] bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-2xl shadow-indigo-950/20 relative overflow-hidden space-y-6"
        >
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200">
              <Compass className="w-3.5 h-3.5 text-indigo-300" />
              <span>Getting Started Guide</span>
            </div>
            <h2 className="text-2xl font-bold font-display">Launch your AI Chatbot in 3 quick steps</h2>
            <p className="text-xs sm:text-sm text-indigo-200 font-light leading-relaxed">
              Your workspace is ready with live RAG pipelines, pgvector search, and real-time knowledge gap intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2">
            <Link
              href="/dashboard/chatbots/new"
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  1. Create AI Chatbot
                </h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Pick a theme (Liquid Glass, Mobile Companion, Dark Neon) and customize system prompts.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-300 group-hover:translate-x-1 transition-transform">
                <span>Configure Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/dashboard/knowledge-base"
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  2. Upload Knowledge
                </h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Upload PDFs, API documentation, or crawl websites to build high-accuracy vector embeddings.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-300 group-hover:translate-x-1 transition-transform">
                <span>Upload Documents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/dashboard/chatbots"
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  3. Embed Widget
                </h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Embed the floating chat widget on any website with a single-line snippet or iframe.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-300 group-hover:translate-x-1 transition-transform">
                <span>View Integrations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid: Telemetry & Knowledge Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Telemetry */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Conversations & Live Traffic</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time visitor interactions and streaming queries</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Live Engine Ready</span>
            </div>
          </div>

          {convCount === 0 ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-slate-900">No conversations recorded yet</h4>
                <p className="text-xs text-slate-500">
                  When visitors interact with your chatbots, session logs, response latency, and sentiment analytics will appear here in real-time.
                </p>
              </div>
              <Link
                href="/dashboard/chatbots/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
              >
                <span>Create your first Chatbot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics?.recent_conversations?.map((conv) => (
                <div key={conv.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      #{conv.id.substring(0, 4)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{conv.title}</p>
                      <p className="text-[10px] text-slate-400">Visitor: {conv.visitor_id.substring(0, 8)}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {conv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Knowledge Gaps & Health */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Satisfaction / Health Box */}
          <div className="p-6 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-400">KNOWLEDGE HEALTH</span>
              <span className="font-bold text-emerald-600">{metrics?.health_score ?? 100}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">
                {metrics?.health_score ?? 100}%
              </span>
              <span className="text-xs font-semibold text-slate-400">optimal coverage</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.health_score ?? 100}%` }}
              />
            </div>
          </div>

          {/* Knowledge Gaps Card */}
          <div className="p-6 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900">Knowledge Gaps</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                {metrics?.knowledge_gaps_count ?? 0} GAPS
              </span>
            </div>

            {(metrics?.knowledge_gaps_count ?? 0) === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  No gaps detected. The AI gap intelligence engine will continuously flag questions that require new documentation.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  {metrics?.knowledge_gaps_count} questions resulted in fallback responses.
                </p>
                <Link
                  href="/dashboard/knowledge-gaps"
                  className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-between transition-colors"
                >
                  <span>Review & Generate Drafts</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
