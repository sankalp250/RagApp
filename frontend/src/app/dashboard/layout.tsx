"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  LayoutDashboard,
  Sparkles,
  Database,
  AlertTriangle,
  MessageSquare,
  Activity,
  Layers,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
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
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api.get<OverviewMetrics>("/analytics/overview");
        setMetrics(data);
      } catch (err) {
        // Fallback for offline/unauthenticated
      }
    }
    loadMetrics();
  }, []);

  // Derived user display info
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Studio User";
  const displayOrg = user?.organization_name || `${displayName}'s Workspace`;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AI";

  const agentsCount = metrics?.agents_count ?? 0;
  const docsCount = metrics?.documents_count ?? 0;
  const gapsCount = metrics?.knowledge_gaps_count ?? 0;
  const healthScore = metrics?.health_score ?? 100;

  const sidebarLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "My Chatbots",
      href: "/dashboard/chatbots",
      icon: Bot,
      badge: agentsCount > 0 ? `${agentsCount} Active` : undefined,
    },
    {
      name: "Knowledge Base",
      href: "/dashboard/knowledge-base",
      icon: Database,
      badge: docsCount > 0 ? `${docsCount} Docs` : undefined,
    },
    {
      name: "Knowledge Gaps",
      href: "/dashboard/knowledge-gaps",
      icon: AlertTriangle,
      badge: gapsCount > 0 ? `${gapsCount} New` : undefined,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
    { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
    { name: "Integrations", href: "/dashboard/integrations", icon: Layers },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdff] text-slate-900 flex relative overflow-x-hidden font-sans">
      {/* Background Subtle Ambient Mesh Glows */}
      <div className="fixed top-0 left-64 w-[600px] h-[600px] ambient-glow-purple -z-10 blur-3xl pointer-events-none opacity-40" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] ambient-glow-pink -z-10 blur-3xl pointer-events-none opacity-30" />

      {/* Frosted Liquid Glass Sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between border-r border-slate-200/80 bg-white/80 backdrop-blur-2xl z-30 fixed top-0 bottom-0 left-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-slate-900 font-display">
                  Chatin
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-200">
                  STUDIO
                </span>
              </div>
            </Link>
          </div>

          {/* Org Switcher */}
          <div className="p-3 border-b border-slate-100 relative">
            <button
              onClick={() => setOrgMenuOpen(!orgMenuOpen)}
              className="w-full p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {displayOrg.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{displayOrg}</h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email || "Enterprise Plan"}</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Org Dropdown Menu */}
            <AnimatePresence>
              {orgMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-16 left-3 right-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 shadow-xl z-40 space-y-1 text-xs"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setOrgMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Workspace Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setOrgMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-600"
                      }`}
                    />
                    <span>{link.name}</span>
                  </div>

                  {link.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : link.badgeColor || "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Agent Health / Upgrade Status & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/50 border border-indigo-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-indigo-900">Knowledge Health</span>
              <span className="text-xs font-black text-indigo-600">{healthScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-indigo-200/50 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <Link
              href="/dashboard/knowledge-gaps"
              className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>
                {gapsCount > 0 ? `Review ${gapsCount} Knowledge Gaps` : "No Knowledge Gaps Detected"}
              </span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {initials}
              </div>
              <span className="font-semibold text-slate-800 text-xs truncate">{displayName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Link href="/" className="p-1 hover:text-indigo-600 transition-colors" title="View Landing Page">
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={logout}
                className="p-1 hover:text-rose-600 transition-colors cursor-pointer text-slate-400 hover:bg-rose-50 rounded-lg"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between">
          {/* Quick Search */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search knowledge, gaps, conversations... (Cmd + K)"
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chatbots/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chatbot</span>
            </Link>

            <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
              <Bell className="w-4 h-4" />
              {gapsCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>

            {/* User Profile / Logout Button in Header */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {initials}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">{displayName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-11 w-48 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 shadow-xl z-50 space-y-1 text-xs"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
