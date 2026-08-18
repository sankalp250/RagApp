"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Code,
  Settings,
  Plus,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Building,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, User } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      // Demo fallback user if not logged in
      setUser({
        id: "demo-user",
        email: "alex@acme.corp",
        full_name: "Alex Rivera",
        is_active: true,
      });
    }
  }, []);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agents", href: "/dashboard/agents", icon: Bot },
    { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
    { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Knowledge Gaps", href: "/dashboard/knowledge-gaps", icon: AlertTriangle },
    { label: "Deploy & Widget", href: "/dashboard/deploy", icon: Code },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    api.logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* Fixed Left Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex">
        <div className="space-y-6">
          
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Chatin</span>
          </Link>

          {/* Org Switcher Pill */}
          <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">Acme Corp</p>
                <p className="text-[10px] text-slate-400">Enterprise Plan</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Menu & Logout */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || "User"}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents, documents, conversations..."
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-pink-500 rounded-full absolute top-1.5 right-1.5" />
            </button>

            <Link href="/dashboard/agents/new">
              <Button variant="gradient" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Agent
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Children */}
        <main className="p-6 md:p-8 space-y-8 flex-1">{children}</main>
      </div>

    </div>
  );
}
