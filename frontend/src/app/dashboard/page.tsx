"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Star,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Download,
  Calendar,
  Sparkles,
  Bot,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, AnalyticsHealthReport, KnowledgeGap } from "@/lib/api";

export default function DashboardOverviewPage() {
  const [healthData, setHealthData] = useState<AnalyticsHealthReport>({
    health_score: 82,
    status: "healthy",
    total_conversations: 12482,
    resolution_rate: 87.4,
    avg_response_time_sec: 1.42,
    user_satisfaction: 4.6,
    active_gaps_count: 27,
    high_severity_gaps_count: 5,
    top_topics: [
      { topic: "Delivery address changes", count: 143 },
      { topic: "International returns", count: 91 },
      { topic: "Warranty policy", count: 67 },
    ],
  });

  const [topAgents] = useState([
    { name: "Support Assistant", chats: 8482, growth: "+14.2%", status: "Active" },
    { name: "Sales Assistant", chats: 2341, growth: "+8.1%", status: "Active" },
    { name: "FAQ Bot", chats: 1659, growth: "+3.7%", status: "Active" },
  ]);

  const [recentGaps] = useState([
    {
      id: "gap-1",
      topic: "Delivery address changes",
      chats: "143 conversations",
      successRate: "32% success",
      severity: "Needs Attention",
    },
    {
      id: "gap-2",
      topic: "International returns",
      chats: "91 conversations",
      successRate: "28% success",
      severity: "High Priority",
    },
    {
      id: "gap-3",
      topic: "Warranty after replacement",
      chats: "67 conversations",
      successRate: "41% success",
      severity: "Moderate",
    },
  ]);

  useEffect(() => {
    // Attempt fetching live data from backend
    api.getHealthReport()
      .then((res) => {
        if (res && res.total_conversations !== undefined) {
          setHealthData(res);
        }
      })
      .catch(() => {
        // Fallback to initial rich mock data if backend has no records yet
      });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Overview Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your AI knowledge agents today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>May 12 - May 18, 2026</span>
          </div>

          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Conversations</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {healthData.total_conversations.toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span>↑ +12.5%</span>
            <span className="text-slate-500 font-normal">vs last 7 days</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Resolution Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {Math.round(healthData.resolution_rate)}%
          </p>
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span>↑ +8.3%</span>
            <span className="text-slate-500 font-normal">vs last 7 days</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Knowledge Gaps</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {healthData.active_gaps_count}
          </p>
          <p className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
            <span>+5 new</span>
            <span className="text-slate-500 font-normal">requires docs update</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Satisfaction Score</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-950 text-yellow-400 flex items-center justify-center">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {healthData.user_satisfaction}/5
          </p>
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span>↑ +0.4</span>
            <span className="text-slate-500 font-normal">positive feedback</span>
          </p>
        </div>

      </div>

      {/* Row 2: Conversations Over Time & Top Performing Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Conversations Over Time (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Conversations Over Time</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300">
                Daily Trend
              </span>
            </div>

            {/* Visual Spline */}
            <div className="h-44 w-full relative my-2">
              <svg viewBox="0 0 400 120" className="w-full h-full">
                <defs>
                  <linearGradient id="dashChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 Q60,30 120,60 T240,25 T360,40 T400,20 L400,120 L0,120 Z"
                  fill="url(#dashChartGrad)"
                />
                <path
                  d="M0,80 Q60,30 120,60 T240,25 T360,40 T400,20"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-800">
            <span>May 12</span>
            <span>May 13</span>
            <span>May 14</span>
            <span>May 15</span>
            <span>May 16</span>
            <span>May 17</span>
            <span>May 18</span>
          </div>
        </div>

        {/* Top Performing Agents (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Top Performing Agents</h3>
              <Link href="/dashboard/agents" className="text-[11px] font-bold text-indigo-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {topAgents.map((agent, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{agent.name}</p>
                      <p className="text-[10px] text-slate-400">{agent.chats.toLocaleString()} chats</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400">{agent.growth}</span>
                    <span className="block text-[9px] font-semibold text-slate-400">{agent.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/dashboard/agents/new" className="pt-4">
            <Button variant="outline" size="sm" className="w-full justify-center text-xs">
              + Create New Agent
            </Button>
          </Link>
        </div>

      </div>

      {/* Row 3: Knowledge Health & Recent Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Knowledge Health Gauge (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-4">Knowledge Health</h3>

          <div className="flex items-center gap-6 py-4">
            {/* Radial Gauge Visual */}
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="82, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-white">{healthData.health_score}%</span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase">Good</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Your knowledge base is healthy!</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {healthData.active_gaps_count} total knowledge gaps detected across recent sessions.
              </p>
              <Link href="/dashboard/knowledge-gaps" className="inline-block text-[11px] font-bold text-indigo-400 hover:underline pt-1">
                Resolve Gaps &rarr;
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Based on grounding score threshold (&ge; 0.60) &amp; composite evaluation metrics.
          </div>
        </div>

        {/* Recent Knowledge Gaps (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Knowledge Gaps</h3>
            <Link href="/dashboard/knowledge-gaps" className="text-[11px] font-bold text-indigo-400 hover:underline">
              View all gaps &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{gap.topic}</p>
                    <p className="text-[10px] text-slate-400">{gap.chats}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-800/40 px-2 py-0.5 rounded-lg">
                    {gap.successRate}
                  </span>
                  <Link href={`/dashboard/knowledge-gaps`}>
                    <Button variant="ghost" size="sm" className="p-1 text-slate-400 hover:text-white">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Automatically grouped by semantic embedding clustering.
          </div>
        </div>

      </div>

    </div>
  );
}
