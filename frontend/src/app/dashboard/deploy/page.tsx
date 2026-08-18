"use client";

import React, { useState } from "react";
import {
  Code,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Bot,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";

export default function DeployWidgetPage() {
  const [embedTab, setEmbedTab] = useState("javascript");
  const [copied, setCopied] = useState(false);

  // Widget preview state
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi there! 👋 How can I assist you today?" },
  ]);
  const [inputVal, setInputVal] = useState("");

  const jsSnippet = `<script
  src="http://127.0.0.1:3000/widget.js"
  data-agent-key="pk_live_support_12345"
  data-theme="light"
  data-position="bottom-right"
  async>
</script>`;

  const iframeSnippet = `<iframe
  src="http://127.0.0.1:3000/widget/pk_live_support_12345"
  width="380"
  height="600"
  frameborder="0"
  allow="microphone">
</iframe>`;

  const currentSnippet = embedTab === "javascript" ? jsSnippet : iframeSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickPrompt = (promptText: string) => {
    setMessages((prev) => [...prev, { role: "user", text: promptText }]);
    setTimeout(() => {
      let reply = "Here is the exact information from our verified knowledge base.";
      if (promptText.includes("order")) {
        reply = "To track your order, please provide your 8-digit order confirmation number.";
      } else if (promptText.includes("Return")) {
        reply = "Our policy allows free returns within 30 days of package arrival.";
      }
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 700);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Your AI Agent is Ready!</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Embed this lightweight snippet on your website, Webflow, Shopify, or React app.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Embed Code Generator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          
          <Tabs
            tabs={[
              { id: "javascript", label: "JavaScript Snippet" },
              { id: "iframe", label: "IFrame Embed" },
            ]}
            activeTab={embedTab}
            onChange={setEmbedTab}
          />

          {/* Code Box */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto">
            <pre>{currentSnippet}</pre>

            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          {/* Platform Setup Guides */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Works with all platforms
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <span>🛍️</span> Shopify
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <span>🌐</span> Webflow
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <span>📝</span> WordPress
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <span>⚛️</span> Next.js / React
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive Sandbox (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex flex-col h-[500px]">
            
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-xs">
                  🤖
                </div>
                <div>
                  <h5 className="text-xs font-bold">AI Assistant</h5>
                  <span className="text-[10px] text-indigo-200">Online &bull; Live Preview</span>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-100 border border-slate-700"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Suggestion Chips */}
              <div className="space-y-2 pt-2">
                {["Track my order", "Return policy", "Contact support"].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(chip)}
                    className="w-full text-left p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/50 text-xs font-semibold text-indigo-200 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button className="p-2 rounded-xl bg-indigo-600 text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
