"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  Save,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Textarea } from "@/components/ui/Input";

export default function AgentCustomizePage() {
  const [activeTab, setActiveTab] = useState("design");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Customization State
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [chatStyle, setChatStyle] = useState<"modern" | "rounded" | "bubble" | "minimal">("modern");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "center">("bottom-right");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! 👋 How can I help you today?");
  const [showAvatar, setShowAvatar] = useState(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState(true);
  const [font, setFont] = useState("Inter");
  const [isSaved, setIsSaved] = useState(false);

  // Live Simulator Messages
  const [testMessages, setTestMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hi! 👋 How can I help you today?" },
    { role: "user", text: "Can I change my delivery address?" },
    { role: "assistant", text: "Yes, you can change your delivery address before the order is shipped. Would you like me to guide you through the process?" },
  ]);
  const [inputVal, setInputVal] = useState("");

  const themeColors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#0F172A", // Dark Slate
  ];

  const handleSendTestMessage = () => {
    if (!inputVal.trim()) return;
    setTestMessages((prev) => [...prev, { role: "user", text: inputVal.trim() }]);
    setInputVal("");
    setTimeout(() => {
      setTestMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Got it! Your custom agent is connected and responding using your latest system prompt." },
      ]);
    }, 600);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
            <Button variant="outline" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">Customize Your AI Agent</h1>
            <p className="text-xs text-slate-400">Design, configure and deploy your agent in minutes.</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          variant="gradient"
          size="sm"
          leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
        >
          {isSaved ? "Saved Successfully!" : "Save & Next"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "design", label: "Design" },
          { id: "behavior", label: "Behavior & Prompt" },
          { id: "knowledge", label: "Knowledge Base" },
          { id: "integrations", label: "Integrations" },
          { id: "deploy", label: "Deploy & Embed" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Studio Canvas (2 Columns: Controls on Left, Live Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Controls (7 Columns) */}
        <div className="lg:col-span-6 space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          
          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Theme Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {themeColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                    primaryColor === color ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "hover:scale-110"
                  }`}
                >
                  {primaryColor === color && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Chat Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(["modern", "rounded", "bubble", "minimal"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setChatStyle(style)}
                  className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    chatStyle === style
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Widget Position
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["bottom-right", "bottom-left", "center"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    position === pos
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {pos.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Welcome Message */}
          <Textarea
            label="Welcome Message"
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />

          {/* Toggles */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Show Agent Avatar</p>
                <p className="text-[11px] text-slate-400">Display assistant icon in header and bubbles</p>
              </div>
              <input
                type="checkbox"
                checked={showAvatar}
                onChange={(e) => setShowAvatar(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Show Typing Indicator</p>
                <p className="text-[11px] text-slate-400">Display animated 3-dot typing feedback</p>
              </div>
              <input
                type="checkbox"
                checked={showTypingIndicator}
                onChange={(e) => setShowTypingIndicator(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Font Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Font Family
            </label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Inter">Inter (Clean &amp; Modern)</option>
              <option value="Outfit">Outfit (Display &amp; Bold)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Roboto">Roboto</option>
            </select>
          </div>

        </div>

        {/* Right Live Preview Studio (5 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Device Switcher Bar */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 px-2">Live Preview Sandbox</span>
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-lg transition-colors ${previewDevice === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-1.5 rounded-lg transition-colors ${previewDevice === "tablet" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-lg transition-colors ${previewDevice === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulated Chat Widget Container */}
          <div className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-6 flex items-center justify-center min-h-[520px]">
            
            <div
              className={`w-full transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
                previewDevice === "mobile" ? "max-w-xs h-[480px]" : "max-w-sm h-[480px]"
              }`}
              style={{
                borderRadius: chatStyle === "rounded" ? "1.75rem" : chatStyle === "bubble" ? "2rem" : "1rem",
              }}
            >
              {/* Widget Header */}
              <div
                style={{ backgroundColor: primaryColor }}
                className="p-4 text-white flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  {showAvatar && (
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-sm">
                        🤖
                      </div>
                      <span className="w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0" />
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-bold leading-none">Support Assistant</h5>
                    <span className="text-[10px] opacity-80">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Stream Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {testMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      style={{
                        backgroundColor: m.role === "user" ? primaryColor : undefined,
                        borderRadius: chatStyle === "rounded" ? "1.25rem" : "0.875rem",
                      }}
                      className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {showTypingIndicator && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendTestMessage()}
                  placeholder="Type your message..."
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendTestMessage}
                  style={{ backgroundColor: primaryColor }}
                  className="p-2 rounded-xl text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
