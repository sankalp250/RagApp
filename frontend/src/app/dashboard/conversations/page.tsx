"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Filter,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface MessageItem {
  id?: string;
  sender: "user" | "bot";
  role?: string;
  text: string;
  time: string;
  tool?: string;
  latency_ms?: number;
}

interface ConversationItem {
  id: string;
  customerName: string;
  channel: string;
  agent_name?: string;
  agent_id?: string;
  visitor_id?: string;
  lastMessage: string;
  time: string;
  status: string;
  messages: MessageItem[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await api.get<ConversationItem[]>("/conversations");
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        if (list.length > 0) {
          setSelectedConv(list[0]);
        }
      } catch (err) {
        console.error("Failed to load live conversations", err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  const filteredList =
    filter === "All" ? conversations : conversations.filter((c) => c.status === filter);

  const handleSendAdminReply = () => {
    if (!replyText.trim() || !selectedConv) return;
    const updated = {
      ...selectedConv,
      messages: [
        ...selectedConv.messages,
        { sender: "bot" as const, text: replyText, time: "Just now", tool: "Agent Co-Pilot" },
      ],
    };
    setSelectedConv(updated);
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setReplyText("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Live Conversations Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Inspect real-time customer sessions, tool calling traces, and AI confidence scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["All", "Resolved", "Escalated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === f
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-bold">Loading conversation inbox...</span>
        </div>
      ) : conversations.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              No customer conversations recorded yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              When visitors interact with your deployed chatbots, live message threads, retrieval citations, and agent tool calling logs will stream here in real-time.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/chatbots"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
            >
              <span>View Deployed Chatbots</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* 2-Column Split Inbox */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Conversation List */}
          <div className="lg:col-span-5 p-4 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-2.5 max-h-[640px] overflow-y-auto">
            {filteredList.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {conv.customerName.charAt(0)}
                      </div>
                      <span className="font-bold text-xs text-slate-900">{conv.customerName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{conv.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 truncate mb-2 font-medium">{conv.lastMessage}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{conv.channel}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        conv.status === "Gap Detected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : conv.status === "Tool Executed"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Thread & Trace Inspector */}
          {selectedConv ? (
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
              <div>
                {/* Thread Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {selectedConv.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{selectedConv.customerName}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">{selectedConv.channel} · Active Session</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    {selectedConv.status}
                  </span>
                </div>

                {/* Chat Thread */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {selectedConv.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                            : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none font-medium"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {msg.tool && (
                          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-600">
                            <Sparkles className="w-3 h-3" />
                            <span>{msg.tool}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Reply & Co-pilot Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAdminReply()}
                  placeholder="Type manual co-pilot reply or guidance..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-100 rounded-full border-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
                <button
                  onClick={handleSendAdminReply}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md cursor-pointer hover:opacity-90 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 flex items-center justify-center text-xs text-slate-400">
              Select a conversation thread on the left to inspect live session telemetry.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
