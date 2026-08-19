"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot,
  Layers,
  Database,
  Sliders,
  Settings,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { HERO_METRICS, RECENT_CONVERSATIONS_MOCK, TOP_TOPICS_MOCK } from "@/lib/data";

const TABS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "knowledge", label: "Knowledge Base", icon: Database },
  { id: "design", label: "Design & Widget", icon: Sliders },
  { id: "settings", label: "Settings", icon: Settings },
];

export function HeroDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("Daily");

  // Auto-cycle tabs for dynamic life
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const nextIndex = (TABS.findIndex((t) => t.id === current) + 1) % TABS.length;
        return TABS[nextIndex].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Chart data points
  const points1 = [32, 45, 38, 56, 48, 68, 59, 75, 82, 94];
  const points2 = [18, 26, 22, 34, 30, 42, 38, 50, 58, 64];

  return (
    <div className="w-full rounded-[36px] bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_30px_70px_-20px_rgba(99,102,241,0.12)] p-4 sm:p-6 lg:p-7 relative overflow-hidden">
      {/* Top Bar inside Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Acme Enterprise Agent
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Synced with Shopify, Slack & 94 Crawled Pages
            </p>
          </div>
        </div>

        {/* Action / Date Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span>May 1 – May 31</span>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            99.98% Grounded
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 py-4 overflow-x-auto no-scrollbar border-b border-slate-100">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Conversations</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            {HERO_METRICS.totalConversations}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+23.5% vs last month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Unique Users</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            {HERO_METRICS.uniqueUsers}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+18.2% vs last month</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            {HERO_METRICS.resolutionRate}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+11.3% automated</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Avg Response Time</span>
            <Clock className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            {HERO_METRICS.avgResponseTime}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <TrendingDown className="w-3 h-3" />
            <span>-6.2% faster speed</span>
          </div>
        </div>
      </div>

      {/* Main Chart + Side Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Spline Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Conversations & User Activity
              </h4>
              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Conversations
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  Unique Users
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {["Daily", "Weekly", "Monthly"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeRange(mode)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeRange === mode
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Graphic */}
          <div className="h-44 w-full relative flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 450 140"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="gradIndigoLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradPinkLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="35" x2="450" y2="35" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="450" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="105" x2="450" y2="105" stroke="#f1f5f9" strokeDasharray="4 4" />

              {/* Area 1 */}
              <polygon
                points={`0,140 0,${140 - points1[0]} 50,${140 - points1[1]} 100,${140 - points1[2]} 150,${140 - points1[3]} 200,${140 - points1[4]} 250,${140 - points1[5]} 300,${140 - points1[6]} 350,${140 - points1[7]} 400,${140 - points1[8]} 450,${140 - points1[9]} 450,140`}
                fill="url(#gradIndigoLight)"
              />

              {/* Line 1 */}
              <polyline
                points={`0,${140 - points1[0]} 50,${140 - points1[1]} 100,${140 - points1[2]} 150,${140 - points1[3]} 200,${140 - points1[4]} 250,${140 - points1[5]} 300,${140 - points1[6]} 350,${140 - points1[7]} 400,${140 - points1[8]} 450,${140 - points1[9]}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Line 2 */}
              <polyline
                points={`0,${140 - points2[0]} 50,${140 - points2[1]} 100,${140 - points2[2]} 150,${140 - points2[3]} 200,${140 - points2[4]} 250,${140 - points2[5]} 300,${140 - points2[6]} 350,${140 - points2[7]} 400,${140 - points2[8]} 450,${140 - points2[9]}`}
                fill="none"
                stroke="#ec4899"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Active data point highlight */}
              <circle cx="400" cy={140 - points1[8]} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
            <span>May 1</span>
            <span>May 8</span>
            <span>May 15</span>
            <span>May 22</span>
            <span>May 31</span>
          </div>
        </div>

        {/* Top Topics & Satisfaction */}
        <div className="space-y-4">
          {/* User satisfaction summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/40 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Customer Satisfaction</span>
              <span className="text-xs font-bold text-emerald-600">↑ 8.4%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">4.6/5</span>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Based on 14,280 verified post-chat customer feedback ratings
            </p>
          </div>

          {/* Top topics list */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h5 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Top Customer Topics
            </h5>
            <div className="space-y-2.5">
              {TOP_TOPICS_MOCK.map((topic) => (
                <div key={topic.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{topic.name}</span>
                    <span className="text-slate-500">{topic.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      style={{ width: `${topic.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
