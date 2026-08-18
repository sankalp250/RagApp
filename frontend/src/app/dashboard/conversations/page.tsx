"use client";

import React, { useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, CheckCircle2, Clock, Search, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ConversationsPage() {
  const [conversations] = useState([
    {
      id: "conv-1",
      agentName: "Support Assistant",
      lastMessage: "You can update your delivery address within 24 hours of dispatch.",
      userQuery: "Can I change my delivery address after shipment?",
      score: "0.94",
      latency: "1.2s",
      feedback: "positive",
      time: "2m ago",
    },
    {
      id: "conv-2",
      agentName: "Support Assistant",
      lastMessage: "Free returns are permitted within 30 days of receiving your item.",
      userQuery: "How do I return a product?",
      score: "0.89",
      latency: "1.4s",
      feedback: "positive",
      time: "5m ago",
    },
    {
      id: "conv-3",
      agentName: "Sales Assistant",
      lastMessage: "We ship to over 50 countries worldwide using DHL Express.",
      userQuery: "Do you ship internationally?",
      score: "0.92",
      latency: "1.1s",
      feedback: "none",
      time: "10m ago",
    },
    {
      id: "conv-4",
      agentName: "Support Assistant",
      lastMessage: "I cannot find specific details regarding warranty after third replacement.",
      userQuery: "Does the warranty reset if I get a third replacement unit?",
      score: "0.41",
      latency: "2.1s",
      feedback: "negative",
      time: "25m ago",
    },
  ]);

  const [selectedConv, setSelectedConv] = useState(conversations[0]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Live Conversations</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspect real-time conversation sessions, semantic grounding scores, and visitor feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Conversation List (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-800">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedConv.id === conv.id ? "bg-indigo-950/40 border-l-4 border-indigo-500" : "hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{conv.agentName}</span>
                <span className="text-[10px] text-slate-400">{conv.time}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1">{conv.userQuery}</p>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{conv.lastMessage}</p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px]">
                <span className="text-emerald-400 font-bold">Grounding: {conv.score}</span>
                <span className="text-slate-400">Latency: {conv.latency}</span>
                {conv.feedback === "positive" && <ThumbsUp className="w-3 h-3 text-emerald-400" />}
                {conv.feedback === "negative" && <ThumbsDown className="w-3 h-3 text-rose-400" />}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Message Inspector (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Session Transcript</h3>
              <p className="text-[10px] text-slate-400">ID: {selectedConv.id} &bull; {selectedConv.agentName}</p>
            </div>
            <Badge variant={parseFloat(selectedConv.score) > 0.6 ? "success" : "destructive"}>
              Grounding: {selectedConv.score}
            </Badge>
          </div>

          {/* Transcript Timeline */}
          <div className="space-y-4">
            {/* User Message */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase">User Question</span>
              <p className="text-xs text-slate-200">{selectedConv.userQuery}</p>
            </div>

            {/* Assistant Response */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">AI Assistant Response</span>
                <span className="text-[10px] text-slate-400">Time: {selectedConv.latency}</span>
              </div>
              <p className="text-xs text-slate-100">{selectedConv.lastMessage}</p>
            </div>

            {/* Evidence Citation */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Retrieved Knowledge Source</span>
              </div>
              <p className="text-[11px] text-slate-300 italic">
                &quot;Customers are allowed to modify destination address as long as carrier has not marked package as out-for-delivery.&quot;
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
