"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface ConversationItem {
  id: string;
  customerName: string;
  channel: string;
  lastMessage: string;
  time: string;
  status: "Resolved" | "Gap Detected" | "Tool Executed" | "Escalated";
  messages: Array<{ sender: "user" | "bot"; text: string; time: string; tool?: string }>;
}

const MOCK_INBOX: ConversationItem[] = [
  {
    id: "conv-1",
    customerName: "Alex Rivera",
    channel: "Shopify Widget",
    lastMessage: "Order #8491 shipped via FedEx yesterday! 📦",
    time: "2m ago",
    status: "Tool Executed",
    messages: [
      { sender: "user", text: "Where is my order #8491?", time: "2:14 PM" },
      {
        sender: "bot",
        text: "Order #8491 shipped via FedEx yesterday! 📦 Estimated delivery is tomorrow by 4:00 PM. Tracking: FX-90812389.",
        time: "2:14 PM",
        tool: "Shopify API · orders.get(8491)",
      },
      { sender: "user", text: "Thanks! That was fast.", time: "2:15 PM" },
    ],
  },
  {
    id: "conv-2",
    customerName: "Sarah Chen",
    channel: "Webflow Store",
    lastMessage: "I'm not sure based on the available documentation.",
    time: "14m ago",
    status: "Gap Detected",
    messages: [
      { sender: "user", text: "Can I change my delivery address after my order has shipped?", time: "1:48 PM" },
      {
        sender: "bot",
        text: "I'm not sure based on the available documentation.",
        time: "1:48 PM",
        tool: "Gap Logged · Low Confidence (0.38)",
      },
    ],
  },
  {
    id: "conv-3",
    customerName: "Marcus Vance",
    channel: "Slack Community",
    lastMessage: "What is your refund & warranty policy for parts?",
    time: "45m ago",
    status: "Resolved",
    messages: [
      { sender: "user", text: "What is your refund & warranty policy for replacement parts?", time: "1:10 PM" },
      {
        sender: "bot",
        text: "All replacement parts carry a 1-year warranty from the date of replacement. Returns are accepted within 30 days.",
        time: "1:10 PM",
        tool: "Hybrid RAG · 99.1% Confidence",
      },
    ],
  },
];

export default function ConversationsPage() {
  const [selectedConv, setSelectedConv] = useState<ConversationItem>(MOCK_INBOX[0]);
  const [filter, setFilter] = useState<string>("All");
  const [replyText, setReplyText] = useState("");

  const filteredList =
    filter === "All" ? MOCK_INBOX : MOCK_INBOX.filter((c) => c.status === filter);

  const handleSendAdminReply = () => {
    if (!replyText.trim()) return;
    const updated = {
      ...selectedConv,
      messages: [
        ...selectedConv.messages,
        { sender: "bot" as const, text: replyText, time: "Just now", tool: "Agent Co-Pilot" },
      ],
    };
    setSelectedConv(updated);
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
          {["All", "Tool Executed", "Gap Detected", "Resolved"].map((f) => (
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

      {/* 2-Column Split Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Conversation List */}
        <div className="lg:col-span-5 p-4 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-2.5 max-h-[640px] overflow-y-auto">
          {filteredList.map((conv) => {
            const isSelected = selectedConv.id === conv.id;
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
      </div>
    </div>
  );
}
