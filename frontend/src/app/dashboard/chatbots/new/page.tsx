"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DEFAULT_ARCHETYPES,
  ChatbotArchetype,
  ChatbotThemeConfig,
  DeviceFrame,
  FontFamily,
} from "@/types/chatbot-studio";
import {
  Sparkles,
  Smartphone,
  Tablet,
  Layout,
  Sliders,
  Type,
  Layers,
  Bot,
  Zap,
  Code2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ShoppingBag,
  Image as ImageIcon,
  Video,
  FileText,
  CloudRain,
  Mic,
  Paperclip,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Smile,
  Globe,
} from "lucide-react";
import confetti from "canvas-confetti";

function ChatbotStudioContent() {
  const searchParams = useSearchParams();
  const presetParam = (searchParams.get("preset") as ChatbotArchetype) || "liquid-glass";

  // State: Active Config
  const [config, setConfig] = useState<ChatbotThemeConfig>(
    DEFAULT_ARCHETYPES[presetParam] || DEFAULT_ARCHETYPES["liquid-glass"]
  );

  // State: Active Tab & Active Device Frame
  const [activeTab, setActiveTab] = useState<
    "archetypes" | "theme" | "typography" | "modules" | "behavior" | "embed"
  >("archetypes");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>("widget");

  // State: Live Sandbox Chat Conversation
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      sender: "user" | "bot";
      text: string;
      time: string;
      metadata?: any;
    }>
  >([
    {
      id: "init",
      sender: "bot",
      text: "Hi there! 👋 How can I help you today?",
      time: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync if preset parameter changes in URL
  useEffect(() => {
    if (presetParam && DEFAULT_ARCHETYPES[presetParam]) {
      setConfig(DEFAULT_ARCHETYPES[presetParam]);
      if (presetParam === "chatia-mobile" || presetParam === "obsidian-glow" || presetParam === "editorial-grid" || presetParam === "pastel-lifestyle") {
        setDeviceFrame("mobile");
      } else if (presetParam === "split-canvas") {
        setDeviceFrame("tablet");
      } else {
        setDeviceFrame("widget");
      }
    }
  }, [presetParam]);

  // Handle Preset Switching
  const handleSelectArchetype = (archetype: ChatbotArchetype) => {
    setConfig(DEFAULT_ARCHETYPES[archetype]);
    if (archetype === "chatia-mobile" || archetype === "obsidian-glow" || archetype === "editorial-grid" || archetype === "pastel-lifestyle") {
      setDeviceFrame("mobile");
    } else if (archetype === "split-canvas") {
      setDeviceFrame("tablet");
    } else {
      setDeviceFrame("widget");
    }
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "bot",
        text: DEFAULT_ARCHETYPES[archetype].modules.welcomeHeader.subtitle,
        time: "Just now",
      },
    ]);
  };

  // Handle Interactive Query in Sandbox
  const handleSendMessage = (text?: string) => {
    const query = text || inputQuery;
    if (!query.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "user",
        text: query,
        time: "Just now",
      },
    ]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "I found this in your verified knowledge base! Grounded with 99.4% precision.";
      let meta: any = null;

      if (query.toLowerCase().includes("order") || query.toLowerCase().includes("8491")) {
        replyText = "Order #8491 was dispatched via FedEx yesterday. Tracking: FX-90812389. Estimated arrival tomorrow by 4:00 PM.";
        meta = { tool: "Shopify API · Verified" };
      } else if (query.toLowerCase().includes("recipe") || query.toLowerCase().includes("pancake")) {
        replyText = "Here is a healthy recipe for fluffy protein pancakes:\n• 1 cup Whole wheat flour\n• 1 tsp Baking powder\n• 1 ripe banana\n• 1 scoop vanilla protein\nMix and cook on medium heat for 2 mins each side!";
        meta = { recipe: true };
      } else if (query.toLowerCase().includes("weather")) {
        replyText = "San Francisco: 22° Rain Showers. It will rain in 1 hour, I recommend taking an umbrella.";
        meta = { weather: true };
      } else if (query.toLowerCase().includes("sushi")) {
        replyText = "Sushi Roll Step-by-Step:\n1. Spread sushi rice evenly over Nori.\n2. Add fresh salmon & avocado strips.\n3. Roll tightly using a bamboo mat.\n4. Slice with a damp sharp knife and enjoy!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: replyText,
          time: "Just now",
          metadata: meta,
        },
      ]);
    }, 1000);
  };

  const handleSaveAndExport = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setActiveTab("embed");
  };

  const embedScript = `<script
  src="https://cdn.chatin.ai/widget.js"
  data-agent-id="${config.id}"
  data-archetype="${config.archetype}"
  data-font="${config.typography.fontFamily}"
  data-accent="${config.theme.accentColor}"
  async
></script>`;

  return (
    <div className="space-y-6">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {config.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold capitalize">
              {config.archetype.replace("-", " ")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Configure liquid glassmorphism, fonts, rich card modules, and grounded tools in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMessages([{ id: "init", sender: "bot", text: config.modules.welcomeHeader.subtitle, time: "Just now" }])}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveAndExport}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Save & Get Embed Code</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Control Panel + Right Live Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT CONTROLS PANEL (5 Tabs) ================= */}
        <div className="lg:col-span-5 p-6 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6">
          {/* Tab Navigation Row */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: "archetypes", label: "Archetypes", icon: Sparkles },
              { id: "theme", label: "Theme & Glass", icon: Sliders },
              { id: "typography", label: "Typography", icon: Type },
              { id: "modules", label: "Modules & Cards", icon: Layers },
              { id: "behavior", label: "Tools & RAG", icon: Zap },
              { id: "embed", label: "Embed Code", icon: Code2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ARCHETYPES & PRESETS */}
          {activeTab === "archetypes" && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Select an Industry-Level Archetype
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "liquid-glass", name: "Liquid Glass", desc: "Iridescent frosted glass", color: "from-indigo-600 to-pink-500" },
                  { id: "chatia-mobile", name: "Chatia Companion", desc: "Cards & media carousels", color: "from-pink-500 to-rose-600" },
                  { id: "obsidian-glow", name: "Obsidian Glow", desc: "Deep cobalt dark mode", color: "from-blue-600 to-indigo-900" },
                  { id: "split-canvas", name: "Split Canvas", desc: "Tablet research dual-pane", color: "from-sky-500 to-indigo-600" },
                  { id: "editorial-grid", name: "ChaTin Editorial", desc: "Yellow & serif grid", color: "from-amber-400 to-yellow-500 text-black" },
                  { id: "pastel-lifestyle", name: "Pastel Lifestyle", desc: "Pink clouds & SMM", color: "from-pink-400 to-amber-200" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectArchetype(item.id as ChatbotArchetype)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.archetype === item.id
                        ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <div className={`h-10 w-full rounded-xl bg-gradient-to-r ${item.color} mb-2 flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                      {item.name}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: THEME & LIQUID GLASS */}
          {activeTab === "theme" && (
            <div className="space-y-5">
              {/* Primary Gradient Palette */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
                  Primary Accent Gradient
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {[
                    "from-indigo-600 via-purple-600 to-pink-600",
                    "from-pink-500 via-rose-500 to-fuchsia-600",
                    "from-blue-600 via-indigo-600 to-purple-800",
                    "from-sky-500 to-indigo-600",
                    "from-amber-400 to-yellow-500",
                    "from-emerald-500 to-teal-600",
                  ].map((grad) => (
                    <button
                      key={grad}
                      onClick={() => setConfig({ ...config, theme: { ...config.theme, primaryGradient: grad } })}
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${grad} transition-all cursor-pointer ${
                        config.theme.primaryGradient === grad ? "ring-4 ring-indigo-500/30 scale-110 shadow-md" : "opacity-80"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Glass Blur Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Liquid Glass Blur</span>
                  <span>{config.theme.glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={config.theme.glassBlur}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, glassBlur: Number(e.target.value) } })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Glass Opacity Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Glass Opacity</span>
                  <span>{config.theme.glassOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.theme.glassOpacity}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, glassOpacity: Number(e.target.value) } })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Corner Radius Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Bubble Corner Radius</span>
                  <span>{config.typography.bubbleRadius}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={config.typography.bubbleRadius}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, bubbleRadius: Number(e.target.value) } })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Border Glow Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Luminous Border Glow</span>
                <input
                  type="checkbox"
                  checked={config.theme.borderGlow}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, borderGlow: e.target.checked } })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & FONTS */}
          {activeTab === "typography" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
                  Font Family
                </label>
                <div className="space-y-2">
                  {(
                    [
                      { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", desc: "Modern tech & clean geometric" },
                      { id: "Outfit", name: "Outfit", desc: "Friendly, high-impact & rounded" },
                      { id: "Inter", name: "Inter", desc: "Neutral enterprise standard" },
                      { id: "Playfair Display", name: "Playfair Display", desc: "Editorial, luxury & serif" },
                      { id: "Space Grotesk", name: "Space Grotesk", desc: "Futuristic & tech minimal" },
                      { id: "JetBrains Mono", name: "JetBrains Mono", desc: "Developer & code terminal" },
                    ] as { id: FontFamily; name: string; desc: string }[]
                  ).map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setConfig({ ...config, typography: { ...config.typography, fontFamily: font.id } })}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        config.typography.fontFamily === font.id
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 block" style={{ fontFamily: font.id }}>
                          {font.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">{font.desc}</span>
                      </div>
                      {config.typography.fontFamily === font.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Title Font Weight
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["normal", "medium", "bold", "black"].map((w) => (
                    <button
                      key={w}
                      onClick={() => setConfig({ ...config, typography: { ...config.typography, titleWeight: w as any } })}
                      className={`p-2 rounded-xl text-xs capitalize font-semibold border transition-all cursor-pointer ${
                        config.typography.titleWeight === w
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODULES & CARDS */}
          {activeTab === "modules" && (
            <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Welcome Greeting
                </label>
                <input
                  type="text"
                  value={config.modules.welcomeHeader.greeting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modules: {
                        ...config.modules,
                        welcomeHeader: { ...config.modules.welcomeHeader, greeting: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Subtitle Prompt
                </label>
                <input
                  type="text"
                  value={config.modules.welcomeHeader.subtitle}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modules: {
                        ...config.modules,
                        welcomeHeader: { ...config.modules.welcomeHeader, subtitle: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Agent Avatar
                </label>
                <div className="flex items-center gap-2">
                  {["✨", "🤖", "👩‍💼", "🔮", "🎨", "🌸"].map((em) => (
                    <button
                      key={em}
                      onClick={() =>
                        setConfig({
                          ...config,
                          modules: {
                            ...config.modules,
                            welcomeHeader: { ...config.modules.welcomeHeader, avatar: em },
                          },
                        })
                      }
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all cursor-pointer ${
                        config.modules.welcomeHeader.avatar === em
                          ? "bg-indigo-50 border-indigo-500 scale-110 shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rich Widget Toggles */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rich Media Cards & Widgets
                </span>
                {[
                  { key: "enableImageCards", label: "Image & Recipe Cards" },
                  { key: "enableWeather", label: "Live Weather Widget" },
                  { key: "enableFileAttachment", label: "File Upload Button" },
                  { key: "enableVoiceInput", label: "Voice / Mic Input Button" },
                  { key: "enableChecklist", label: "Checklists & To-Do Cards" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(config.modules.richWidgets as any)[item.key]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          modules: {
                            ...config.modules,
                            richWidgets: {
                              ...config.modules.richWidgets,
                              [item.key]: e.target.checked,
                            },
                          },
                        })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BEHAVIOR & TOOLS */}
          {activeTab === "behavior" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  RAG Confidence Threshold ({config.behavior.ragConfidenceThreshold * 100}%)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={config.behavior.ragConfidenceThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      behavior: { ...config.behavior, ragConfidenceThreshold: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Queries below this threshold trigger Knowledge Gap clustering.
                </span>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Connected Guarded Tools
                </span>
                {[
                  { key: "enableShopifyTool", label: "Shopify Order Status API" },
                  { key: "enableSlackEscalation", label: "Slack Tier-2 Hand-off" },
                  { key: "enableEmailReceipts", label: "Gmail Invoice & Receipt Dispatcher" },
                  { key: "enableCustomWebhooks", label: "Custom REST Webhook Execution" },
                ].map((tool) => (
                  <label key={tool.key} className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>{tool.label}</span>
                    <input
                      type="checkbox"
                      checked={(config.behavior as any)[tool.key]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          behavior: {
                            ...config.behavior,
                            [tool.key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EMBED CODE */}
          {activeTab === "embed" && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Copy Embed Script Tag
              </span>
              <pre className="p-4 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                {embedScript}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embedScript);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied to Clipboard!" : "Copy Code Snippet"}</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT LIVE SANDBOX PREVIEW ================= */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Device Frame Switcher Bar */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm mb-6">
            {[
              { id: "widget", label: "Floating Widget", icon: Layout },
              { id: "mobile", label: "iPhone 16 Pro", icon: Smartphone },
              { id: "tablet", label: "iPad Split Canvas", icon: Tablet },
              { id: "fullscreen", label: "Fullscreen", icon: Globe },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setDeviceFrame(f.id as DeviceFrame)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    deviceFrame === f.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC DEVICE RENDERER */}
          <div
            className="w-full flex justify-center items-center transition-all duration-300"
            style={{ fontFamily: config.typography.fontFamily }}
          >
            {/* 1. MOBILE PHONE FRAME (iPhone 16 Pro mockup) */}
            {deviceFrame === "mobile" && (
              <div className="w-[375px] h-[720px] rounded-[52px] bg-black p-3.5 shadow-2xl border-4 border-slate-700/60 relative overflow-hidden flex flex-col justify-between">
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                </div>

                {/* Mobile Screen Body */}
                <div
                  className="w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between relative shadow-inner"
                  style={{
                    backgroundColor: config.theme.backgroundColor,
                    backgroundImage:
                      config.theme.bgPattern === "grid"
                        ? "radial-gradient(#000000 1px, transparent 1px)"
                        : undefined,
                    backgroundSize: config.theme.bgPattern === "grid" ? "16px 16px" : undefined,
                  }}
                >
                  {/* Top Status & Header Bar */}
                  <div
                    className={`pt-9 pb-4 px-5 bg-gradient-to-r ${config.theme.primaryGradient} text-white flex items-center justify-between shadow-md`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-xs">
                        {config.modules.welcomeHeader.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">
                          {config.modules.welcomeHeader.userGreetingName || config.name}
                        </h4>
                        <p className="text-[10px] text-white/80">{config.modules.welcomeHeader.statusBadge}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Scrollable Chat Area */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {/* Category Pills */}
                    {config.modules.categoryPills.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {config.modules.categoryPills.map((pill) => (
                          <button
                            key={pill}
                            onClick={() => handleSendMessage(pill)}
                            className="shrink-0 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Featured Action Cards */}
                    {config.modules.featuredActionCards.length > 0 && messages.length <= 1 && (
                      <div className="space-y-2 my-2">
                        {config.modules.featuredActionCards.map((card) => (
                          <button
                            key={card.id}
                            onClick={() => handleSendMessage(card.actionPrompt)}
                            className={`w-full p-3.5 rounded-2xl bg-gradient-to-r ${card.gradient} text-white text-left flex items-center justify-between shadow-sm hover:scale-102 transition-transform cursor-pointer`}
                          >
                            <div>
                              <h5 className="font-bold text-xs">{card.title}</h5>
                              <p className="text-[10px] opacity-80">{card.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Weather Card if enabled */}
                    {config.modules.richWidgets.enableWeather && (
                      <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudRain className="w-6 h-6 text-sky-300" />
                          <div>
                            <span className="text-lg font-bold">22° Rain Showers</span>
                            <p className="text-[10px] opacity-75">San Francisco · Rain in 1 hr</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Messages */}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                            m.sender === "user" ? config.theme.userBubbleBg : config.theme.botBubbleBg
                          }`}
                          style={{
                            borderRadius: `${config.typography.bubbleRadius}px`,
                            borderBottomRightRadius: m.sender === "user" ? "4px" : undefined,
                            borderBottomLeftRadius: m.sender === "bot" ? "4px" : undefined,
                          }}
                        >
                          <p className={`whitespace-pre-line ${m.sender === "user" ? config.theme.userBubbleText : config.theme.botBubbleText}`}>
                            {m.text}
                          </p>

                          {m.metadata?.tool && (
                            <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {m.metadata.tool}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="p-2.5 bg-white rounded-2xl rounded-bl-none w-14 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  <div className="p-3 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center gap-2">
                    {config.modules.richWidgets.enableFileAttachment && (
                      <button className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Ask anything..."
                      className="flex-1 px-3.5 py-2 text-xs bg-slate-100 rounded-full border-none focus:outline-none"
                    />
                    {config.modules.richWidgets.enableVoiceInput && (
                      <button className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer">
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSendMessage()}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.theme.primaryGradient} text-white flex items-center justify-center shadow-md cursor-pointer`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FLOATING WIDGET PREVIEW */}
            {deviceFrame === "widget" && (
              <div
                className="w-full max-w-sm rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-slate-200/80"
                style={{
                  backgroundColor: `rgba(255, 255, 255, ${config.theme.glassOpacity / 100})`,
                  backdropFilter: `blur(${config.theme.glassBlur}px)`,
                }}
              >
                {/* Header */}
                <div className={`p-4 bg-gradient-to-r ${config.theme.primaryGradient} text-white flex items-center justify-between shadow-md`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-xs">
                      {config.modules.welcomeHeader.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{config.name}</h4>
                      <p className="text-[10px] text-white/80">{config.modules.welcomeHeader.statusBadge}</p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
                </div>

                {/* Messages Body */}
                <div className="p-4 space-y-3 min-h-[280px] max-h-[340px] overflow-y-auto bg-slate-50/50">
                  {/* Quick Prompts */}
                  {config.modules.quickPrompts.length > 0 && messages.length <= 1 && (
                    <div className="space-y-1.5 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Quick Suggestions
                      </span>
                      {config.modules.quickPrompts.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSendMessage(q)}
                          className="w-full p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-left text-xs font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer block"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                          m.sender === "user" ? config.theme.userBubbleBg : config.theme.botBubbleBg
                        }`}
                        style={{
                          borderRadius: `${config.typography.bubbleRadius}px`,
                        }}
                      >
                        <p className={`whitespace-pre-line ${m.sender === "user" ? config.theme.userBubbleText : config.theme.botBubbleText}`}>
                          {m.text}
                        </p>
                        {m.metadata?.tool && (
                          <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {m.metadata.tool}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="p-2.5 bg-white rounded-2xl w-14 shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-100 rounded-full border-none focus:outline-none text-slate-800"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.theme.primaryGradient} text-white flex items-center justify-center shadow-md cursor-pointer`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. TABLET SPLIT CANVAS & FULLSCREEN PREVIEW */}
            {(deviceFrame === "tablet" || deviceFrame === "fullscreen") && (
              <div className="w-full max-w-2xl rounded-[36px] bg-white border border-slate-200/80 shadow-2xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[460px]">
                {/* Left Panel: Doc results & history */}
                <div className="md:col-span-5 border-r border-slate-100 pr-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Knowledge Canvas
                  </h4>
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-900 block">Growth Predictions 2026.pdf</span>
                    <p className="text-[11px] text-indigo-700 mt-1">94 pages indexed · OCR Complete</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block">Shipping & Return Policies</span>
                    <p className="text-[11px] text-slate-500 mt-1">Grounded sync active</p>
                  </div>
                </div>

                {/* Right Panel: Chat Stream */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                            m.sender === "user" ? config.theme.userBubbleBg : config.theme.botBubbleBg
                          }`}
                          style={{ borderRadius: `${config.typography.bubbleRadius}px` }}
                        >
                          <p className={`whitespace-pre-line ${m.sender === "user" ? config.theme.userBubbleText : config.theme.botBubbleText}`}>
                            {m.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Ask questions about this dossier..."
                      className="flex-1 px-3.5 py-2 text-xs bg-slate-100 rounded-full border-none"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.theme.primaryGradient} text-white flex items-center justify-center shadow-md cursor-pointer`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewChatbotPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Studio...</div>}>
      <ChatbotStudioContent />
    </Suspense>
  );
}
