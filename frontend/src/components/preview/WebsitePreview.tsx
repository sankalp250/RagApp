"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatbotThemeConfig, ChatMessage } from "@/types/chatbot-studio";
import { ChatLauncher } from "@/components/chatbot/ChatLauncher";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

interface WebsitePreviewProps {
  config: ChatbotThemeConfig;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  defaultOpen?: boolean;
}

export function WebsitePreview({ config, messages, onSend, defaultOpen = true }: WebsitePreviewProps) {
  const [chatOpen, setChatOpen] = useState(defaultOpen);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl bg-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Fake browser chrome */}
      <div className="bg-[#f1f3f4] border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-lg px-3 py-1 text-[11px] text-gray-400 border border-gray-200">
          https://yourwebsite.com
        </div>
      </div>

      {/* Fake website content */}
      <div className="overflow-y-auto h-full bg-white" style={{ maxHeight: "calc(100% - 40px)" }}>
        {/* Nav */}
        <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">U</div>
            <span className="font-bold text-sm text-gray-900">Untitled UI</span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Overview</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Blog</a>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            Get started
          </button>
        </nav>

        {/* Hero */}
        <section className="px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 font-medium mb-4">
            ✦ Now with AI-powered assistance
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            Build better products,<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">faster than ever.</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            The all-in-one platform for modern teams. Design, build, and ship products with AI assistance built right in.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors">
              Start for free
            </button>
            <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 transition-colors">
              Watch demo →
            </button>
          </div>
        </section>

        {/* Feature grid */}
        <section className="px-6 py-8 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Everything you need</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "⚡", title: "Lightning Fast", desc: "Deploy in minutes, not days" },
              { emoji: "🔒", title: "Enterprise Security", desc: "SOC2 Type II certified" },
              { emoji: "🤖", title: "AI Powered", desc: "Built-in AI for every workflow" },
              { emoji: "📊", title: "Deep Analytics", desc: "Real-time insights & reporting" },
            ].map((f, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="text-xl mb-2">{f.emoji}</div>
                <h3 className="text-xs font-semibold text-gray-900">{f.title}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-8">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Simple pricing</h2>
          <div className="flex flex-col gap-3">
            {[
              { plan: "Starter", price: "$9", desc: "For individuals and small teams", highlight: false },
              { plan: "Pro", price: "$29", desc: "For growing businesses", highlight: true },
            ].map((p, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${p.highlight ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-white"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${p.highlight ? "text-indigo-700" : "text-gray-900"}`}>{p.plan}</span>
                  <span className={`text-xl font-black ${p.highlight ? "text-indigo-600" : "text-gray-900"}`}>{p.price}<span className="text-xs font-normal opacity-50">/mo</span></span>
                </div>
                <p className="text-[11px] text-gray-400">{p.desc}</p>
                <button
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    p.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="h-24" /> {/* Bottom spacer */}
      </div>

      {/* Floating chatbot widget overlay */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-3 z-20">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                width: Math.min(config.layout.width, 360),
                height: Math.min(config.layout.height, 520),
              }}
            >
              <ChatWindow
                config={config}
                messages={messages}
                onSend={onSend}
                onClose={() => setChatOpen(false)}
                isOpen={chatOpen}
                style={{ width: "100%", maxHeight: "100%", height: "100%" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <ChatLauncher config={config} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
  );
}