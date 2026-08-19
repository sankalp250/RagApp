"use client";

import React, { useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  Bot,
} from "lucide-react";
import { TOP_TOPICS_MOCK } from "@/lib/data";

const AGENTS_METRICS = [
  { name: "Acme Support AI", chats: "112,430", resolution: "88.4%", latency: "1.24s", satisfaction: "4.7/5", gaps: 9 },
  { name: "Robby Mobile Companion", chats: "14,200", resolution: "84.2%", latency: "1.68s", satisfaction: "4.5/5", gaps: 4 },
  { name: "Obsidian Voice Assistant", chats: "1,800", resolution: "92.0%", latency: "0.94s", satisfaction: "4.8/5", gaps: 1 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("Last 30 Days");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Conversational Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Continuous reporting across customer sentiment, response latencies, and agent performance.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-2xs text-xs font-bold">
          {["Last 7 Days", "Last 30 Days", "Last Quarter", "Year to Date"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                range === r
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Inquiries</span>
          <span className="text-3xl font-black text-slate-900 font-display">128,430</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> +23.5% vs previous period
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Autonomous Resolution</span>
          <span className="text-3xl font-black text-slate-900 font-display">87.6%</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> +11.3% automated
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Avg Response Speed</span>
          <span className="text-3xl font-black text-slate-900 font-display">1.42s</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingDown className="w-3.5 h-3.5" /> -6.2% faster speed
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Customer CSAT</span>
          <span className="text-3xl font-black text-slate-900 font-display">4.6/5</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> +8.4% positive
          </span>
        </div>
      </div>

      {/* Agent Comparison Table */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900">Deployed Agent Performance Comparison</h3>
          <span className="text-xs font-bold text-slate-500">Live Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Agent Name</th>
                <th className="pb-3">Total Chats</th>
                <th className="pb-3">Resolution Rate</th>
                <th className="pb-3">Avg Latency</th>
                <th className="pb-3">CSAT</th>
                <th className="pb-3">Open Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {AGENTS_METRICS.map((agent) => (
                <tr key={agent.name} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span>{agent.name}</span>
                  </td>
                  <td className="py-4">{agent.chats}</td>
                  <td className="py-4 text-emerald-600 font-bold">{agent.resolution}</td>
                  <td className="py-4 font-mono">{agent.latency}</td>
                  <td className="py-4 font-bold text-amber-600">{agent.satisfaction}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                      {agent.gaps} gaps
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
