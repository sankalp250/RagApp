"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DEFAULT_ARCHETYPES,
  ARCHETYPE_LIST,
  ChatbotArchetype,
  ChatbotThemeConfig,
  ChatMessage,
  DeviceFrame,
} from "@/types/chatbot-studio";
import {
  Sparkles, Globe, MessageCircle, Smartphone, Tablet, Maximize2,
  Sliders, Type, Layers, Zap, Code2, Copy, Check, ChevronLeft,
  Save, Eye, LayoutPanelLeft, Settings2, Bot, RefreshCw, X,
  ArrowLeft, ShoppingBag, FileText, BarChart3, Users, Mic,
  Paperclip,
} from "lucide-react";

// ─── Sandbox Bot Responses ─────────────────────────────────
const SANDBOX_RESPONSES: { patterns: RegExp[]; response: string }[] = [
  {
    patterns: [/product|shop|buy|sale|deal|best seller/i],
    response: "Great choice! Here are some of our best sellers today:",
  },
  {
    patterns: [/order|track|shipment|delivery|where is/i],
    response: "I found your order! Here's the current status:",
  },
  {
    patterns: [/return|refund|policy|cancel/i],
    response: "Our return policy is simple: 30 days, no questions asked. Would you like to start a return?",
  },
  {
    patterns: [/help|support|agent|human|talk/i],
    response: "I'm connecting you with a support agent now. In the meantime, here's what I can help with:",
  },
  {
    patterns: [/price|cost|plan|subscription/i],
    response: "Here's a breakdown of our pricing plans:",
  },
  {
    patterns: [/hello|hi|hey|good/i],
    response: "Hey there! 👋 Great to see you! How can I help you today?",
  },
];

function getFakeBotReply(query: string): string {
  for (const { patterns, response } of SANDBOX_RESPONSES) {
    if (patterns.some((p) => p.test(query))) return response;
  }
  return `I found some relevant information about "${query.slice(0, 30)}${query.length > 30 ? "..." : ""}". Let me pull up the details for you.`;
}

// ─── Left Panel Tab Config ─────────────────────────────────
const LEFT_TABS = [
  { id: "archetypes", label: "Archetypes", icon: Layers },
  { id: "model", label: "AI Model", icon: Zap },
  { id: "theme", label: "Theme", icon: Sliders },
  { id: "typography", label: "Typography", icon: Type },
  { id: "modules", label: "Modules", icon: LayoutPanelLeft },
  { id: "behavior", label: "Behavior", icon: Bot },
  { id: "embed", label: "Deploy", icon: Code2 },
] as const;

type LeftTabId = typeof LEFT_TABS[number]["id"];

// ─── Device Frame Config ───────────────────────────────────
const DEVICE_TABS: { id: DeviceFrame; label: string; icon: React.ElementType }[] = [
  { id: "website", label: "Website", icon: Globe },
  { id: "widget", label: "Widget", icon: MessageCircle },
  { id: "mobile", label: "iPhone", icon: Smartphone },
  { id: "tablet", label: "iPad", icon: Tablet },
];

// ─── Util: Color Picker ────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg border border-white/10 overflow-hidden">
          <input type="color" value={value.startsWith("#") ? value : "#8b5cf6"} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer" />
        </div>
        <span className="text-[10px] font-mono text-slate-500">{value.startsWith("#") ? value : "custom"}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono text-slate-300">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-indigo-500 cursor-pointer"
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-all duration-200 flex items-center ${value ? "bg-indigo-500" : "bg-white/10"}`}
      >
        <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Inline Preview (no external file) ────────────────────
function InlineChatbot({ config, messages, onSend, chatOpen, setChatOpen }: {
  config: ChatbotThemeConfig;
  messages: ChatMessage[];
  onSend: (t: string) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, typography, modules } = config;
  const isGlass = theme.glassBlur > 0;
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSend(inputVal.trim());
    setInputVal("");
  };

  const windowStyle: React.CSSProperties = {
    background: theme.backgroundColor,
    backdropFilter: isGlass ? `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%) contrast(105%)` : undefined,
    WebkitBackdropFilter: isGlass ? `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%) contrast(105%)` : undefined,
    border: isGlass ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: 22,
    fontFamily: `"${typography.fontFamily}", sans-serif`,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: isGlass
      ? `0 24px 70px rgba(0,0,0,${theme.shadowIntensity / 100}), inset 0 1px 1px 0 rgba(255,255,255,0.4), 0 0 25px rgba(99,102,241,0.2)`
      : `0 24px 80px rgba(0,0,0,${theme.shadowIntensity / 120})`,
  };

  const showWelcome = messages.length <= 1;

  return (
    <div style={windowStyle}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ background: theme.primaryGradient }}>
        {modules.welcomeHeader.showAvatar && (
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base ring-2 ring-white/30">
            {modules.welcomeHeader.avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{config.behavior.agentName || "AI Assistant"}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-white/70">{modules.welcomeHeader.statusBadge}</span>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {showWelcome && (
          <>
            <div className="text-center py-2">
              <p className="text-sm font-bold" style={{ color: theme.botBubbleText }}>{modules.welcomeHeader.subtitle}</p>
            </div>
            {modules.categoryPills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {modules.categoryPills.map((pill, i) => (
                  <button key={i} onClick={() => onSend(pill)}
                    className="px-3 py-1.5 text-xs rounded-full font-medium transition-all hover:scale-105"
                    style={{ background: i === 0 ? theme.accentColor : "rgba(255,255,255,0.1)", color: i === 0 ? "#fff" : theme.botBubbleText }}>
                    {pill}
                  </button>
                ))}
              </div>
            )}
            {modules.featuredActionCards.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {modules.featuredActionCards.slice(0, 4).map((card) => (
                  <button key={card.id} onClick={() => onSend(card.actionPrompt)}
                    className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-xl">{card.icon}</span>
                    <p className="text-xs font-semibold mt-1 leading-tight" style={{ color: theme.botBubbleText }}>{card.title}</p>
                    <p className="text-[10px] opacity-50 mt-0.5" style={{ color: theme.botBubbleText }}>{card.subtitle}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {!isUser && modules.welcomeHeader.showAvatar && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: theme.primaryGradient }}>
                  {modules.welcomeHeader.avatar}
                </div>
              )}
              <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                {msg.isTyping ? (
                  <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                    style={{ background: theme.botBubbleBg, borderRadius: typography.bubbleRadius }}>
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: theme.botBubbleText, animationDelay: `${d}ms`, opacity: 0.6 }} />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-2.5 text-xs leading-relaxed"
                    style={{
                      background: isUser ? theme.userBubbleBg : theme.botBubbleBg,
                      color: isUser ? theme.userBubbleText : theme.botBubbleText,
                      borderRadius: typography.bubbleRadius,
                      ...(isGlass && !isUser ? {
                        backdropFilter: `blur(${theme.glassBlur}px)`,
                        border: "1px solid rgba(255,255,255,0.12)"
                      } : {}),
                    }}>
                    {msg.text}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {showWelcome && modules.quickPrompts.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-[10px] opacity-40" style={{ color: theme.botBubbleText }}>Try asking...</p>
            {modules.quickPrompts.slice(0, 3).map((p, i) => (
              <button key={i} onClick={() => onSend(p)}
                className="text-left px-3 py-2 rounded-xl text-xs transition-all hover:scale-[1.01]"
                style={{ background: theme.cardBg, color: theme.botBubbleText, border: "1px solid rgba(255,255,255,0.07)" }}>
                {p} →
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: isGlass ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={modules.inputPlaceholder}
            className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-30"
            style={{ color: theme.botBubbleText }}
          />
          <button onClick={handleSend}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: inputVal.trim() ? theme.accentColor : "rgba(255,255,255,0.1)" }}>
            <span className="text-white text-[10px]">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Website Canvas (inline to avoid circular deps) ────────
function WebsiteCanvas({ config, messages, onSend }: { config: ChatbotThemeConfig; messages: ChatMessage[]; onSend: (t: string) => void }) {
  const [chatOpen, setChatOpen] = useState(true);
  const { theme, modules } = config;

  const launcherShapeClass = {
    circle: "rounded-full",
    "rounded-square": "rounded-2xl",
    pill: "rounded-full",
  }[theme.launcherShape];

  const launcherSizeClass = {
    sm: "w-11 h-11",
    md: "w-13 h-13 w-[52px] h-[52px]",
    lg: "w-16 h-16",
  }[theme.launcherSize];

  return (
    <div className="relative w-full h-full overflow-hidden bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Browser chrome */}
      <div className="bg-[#f1f3f4] border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-2 py-0.5 text-[10px] text-gray-400 border border-gray-200">
          https://yourwebsite.com
        </div>
      </div>

      {/* Scrollable site */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 32px)" }}>
        {/* Nav */}
        <nav className="px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">U</div>
            <span className="font-bold text-xs text-gray-900">Untitled UI</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>Features</span><span>Pricing</span><span>Blog</span>
          </div>
          <button className="text-[10px] px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium">Get started</button>
        </nav>

        {/* Hero */}
        <section className="px-4 py-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-600 font-medium mb-3">
            ✦ Now with AI
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2 leading-tight">
            Build better products,<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">faster than ever.</span>
          </h1>
          <p className="text-[11px] text-gray-400 max-w-xs mx-auto mb-4">
            The all-in-one platform for modern teams. Design, build, and ship with AI.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]">Start free</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-[11px]">Watch demo →</button>
          </div>
        </section>

        {/* Feature grid */}
        <section className="px-4 py-6 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-800 text-center mb-4">Everything you need</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { e: "⚡", t: "Lightning Fast" }, { e: "🔒", t: "Enterprise Security" },
              { e: "🤖", t: "AI Powered" }, { e: "📊", t: "Deep Analytics" },
            ].map((f, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-gray-100">
                <div className="text-base mb-1">{f.e}</div>
                <p className="text-[10px] font-semibold text-gray-800">{f.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-4 py-6">
          <h2 className="text-sm font-bold text-gray-800 text-center mb-4">Simple pricing</h2>
          <div className="flex flex-col gap-2">
            {[
              { plan: "Starter", price: "$9/mo", highlight: false },
              { plan: "Pro", price: "$29/mo", highlight: true },
            ].map((p, i) => (
              <div key={i} className={`p-3 rounded-xl border ${p.highlight ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${p.highlight ? "text-indigo-700" : "text-gray-900"}`}>{p.plan}</span>
                  <span className={`text-sm font-black ${p.highlight ? "text-indigo-600" : "text-gray-900"}`}>{p.price}</span>
                </div>
                <button className={`w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold ${p.highlight ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-700"}`}>
                  Get started
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="h-20" />
      </div>

      {/* Floating chatbot */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-20">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              key="chatwindow"
              initial={{ opacity: 0, scale: 0.9, y: 8, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{ width: 300, height: 420 }}
            >
              <InlineChatbot config={config} messages={messages} onSend={onSend} chatOpen={chatOpen} setChatOpen={setChatOpen} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launcher */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(!chatOpen)}
          style={{ background: theme.launcherBg, color: theme.launcherText }}
          className={`relative flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${launcherSizeClass} ${launcherShapeClass}`}
        >
          {!chatOpen && (
            <motion.div className="absolute inset-0 rounded-[inherit] opacity-30"
              style={{ background: theme.launcherBg }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }} />
          )}
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={18} />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Studio Content ───────────────────────────────────
function ChatbotStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const presetParam = (searchParams.get("preset") as ChatbotArchetype) || "liquid-glass";

  const [config, setConfig] = useState<ChatbotThemeConfig>(
    DEFAULT_ARCHETYPES[presetParam] || DEFAULT_ARCHETYPES["liquid-glass"]
  );
  const [activeTab, setActiveTab] = useState<LeftTabId>("archetypes");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>("website");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Live sandbox chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "init", sender: "bot", text: config.modules.welcomeHeader.subtitle, time: "Just now" },
  ]);

  // Sync from URL
  useEffect(() => {
    if (presetParam && DEFAULT_ARCHETYPES[presetParam]) {
      setConfig(DEFAULT_ARCHETYPES[presetParam]);
      setMessages([{
        id: `init-${Date.now()}`,
        sender: "bot",
        text: DEFAULT_ARCHETYPES[presetParam].modules.welcomeHeader.subtitle,
        time: "Just now",
      }]);
    }
  }, [presetParam]);

  const updateConfig = useCallback((updater: (prev: ChatbotThemeConfig) => ChatbotThemeConfig) => {
    setConfig(updater);
  }, []);

  const updateTheme = (key: string, value: unknown) =>
    updateConfig((prev) => ({ ...prev, theme: { ...prev.theme, [key]: value } }));

  const updateTypography = (key: string, value: unknown) =>
    updateConfig((prev) => ({ ...prev, typography: { ...prev.typography, [key]: value } }));

  const updateBehavior = (key: string, value: unknown) =>
    updateConfig((prev) => ({ ...prev, behavior: { ...prev.behavior, [key]: value } }));

  const updateModules = (key: string, value: unknown) =>
    updateConfig((prev) => ({ ...prev, modules: { ...prev.modules, [key]: value } }));

  const updateRichWidgets = (key: string, value: boolean) =>
    updateConfig((prev) => ({
      ...prev,
      modules: { ...prev.modules, richWidgets: { ...prev.modules.richWidgets, [key]: value } },
    }));

  const handleSelectArchetype = (id: ChatbotArchetype) => {
    const preset = DEFAULT_ARCHETYPES[id];
    setConfig(preset);
    setMessages([{ id: `init-${Date.now()}`, sender: "bot", text: preset.modules.welcomeHeader.subtitle, time: "Just now" }]);
    router.replace(`/dashboard/chatbots/new?preset=${id}`, { scroll: false });
  };

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text, time: "Just now" };
    const typingMsg: ChatMessage = { id: `typing-${Date.now()}`, sender: "bot", isTyping: true, time: "" };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const reply = getFakeBotReply(text);
      setMessages((prev) =>
        prev.filter((m) => !m.isTyping).concat({
          id: `b-${Date.now()}`,
          sender: "bot",
          text: reply,
          time: "Just now",
        })
      );
    }, 800 + Math.random() * 400);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: config.behavior.agentName || "My Chatbot",
          description: config.description,
          model: config.behavior.model || "gemini-2.5-flash",
          system_prompt: config.behavior.systemPrompt,
          configuration: {
            archetype: config.archetype,
            theme: config.theme,
            typography: config.typography,
            layout: config.layout,
            modules: config.modules,
            greeting_message: config.modules.welcomeHeader.greeting,
            bot_title: config.behavior.agentName || "AI Assistant",
            primary_color: config.theme.accentColor,
            placeholder_text: config.modules.inputPlaceholder,
            suggested_questions: config.modules.quickPrompts,
            confidence_threshold: config.behavior.ragConfidenceThreshold,
            fallback_message: config.behavior.fallbackMessage,
            model: config.behavior.model || "gemini-2.5-flash"
          },
        }),
      });
      if (res.ok) { setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 3000); }
    } catch {}
    setIsSaving(false);
  };

  const embedCode = `<script src="https://cdn.chatin.ai/widget.js" data-agent-id="${config.id}" async></script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // ── Left Panel Content ─────────────────────────────────────
  const renderLeftPanel = () => {
    switch (activeTab) {
      case "archetypes":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 font-medium">Choose your chatbot style</p>
            {ARCHETYPE_LIST.map((arch) => (
              <motion.button
                key={arch.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectArchetype(arch.archetype)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  config.archetype === arch.archetype
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/8 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: arch.theme.primaryGradient }}
                  >
                    {arch.modules.welcomeHeader.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-white">{arch.name}</p>
                      {config.archetype === arch.archetype && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold">Active</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{arch.description}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: arch.previewColor }} />
                      <span className="text-[10px] text-slate-500">{arch.behavior.agentName}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case "model":
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-white">Select AI Engine</p>
              <p className="text-[11px] text-slate-400">
                Choose the foundation model that generates grounded answers for this chatbot.
              </p>
            </div>

            {/* Google Gemini Options */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                <span>✦</span> Google Gemini
              </div>

              {/* Gemini 2.5 Flash */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateBehavior("model", "gemini-2.5-flash")}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  (config.behavior.model || "gemini-2.5-flash") === "gemini-2.5-flash"
                    ? "border-indigo-500/80 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                    : "border-white/8 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Gemini 2.5 Flash</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Recommended</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Sub-second latency, official RAG grounding, and optimal token efficiency for live customer chat.
                    </p>
                  </div>
                  {(config.behavior.model || "gemini-2.5-flash") === "gemini-2.5-flash" && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                  )}
                </div>
              </motion.button>

              {/* Gemini 1.5 Pro */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateBehavior("model", "gemini-1.5-pro")}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  config.behavior.model === "gemini-1.5-pro"
                    ? "border-indigo-500/80 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                    : "border-white/8 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Gemini 1.5 Pro</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">2M Context</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Deep document reasoning, massive context dossiers, and complex citation synthesis.
                    </p>
                  </div>
                  {config.behavior.model === "gemini-1.5-pro" && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                  )}
                </div>
              </motion.button>
            </div>

            {/* OpenAI Options */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <span>⚡</span> OpenAI Models
              </div>

              {/* GPT-4o-mini */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateBehavior("model", "gpt-4o-mini")}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  config.behavior.model === "gpt-4o-mini"
                    ? "border-emerald-500/80 bg-emerald-500/15 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "border-white/8 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">GPT-4o Mini</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Fast & Precise</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      High precision OpenAI customer support engine. Superb instruction-following and safety guardrails.
                    </p>
                  </div>
                  {config.behavior.model === "gpt-4o-mini" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                  )}
                </div>
              </motion.button>

              {/* GPT-4o */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateBehavior("model", "gpt-4o")}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  config.behavior.model === "gpt-4o"
                    ? "border-emerald-500/80 bg-emerald-500/15 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "border-white/8 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">GPT-4o Flagship</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Premier</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Flagship multimodal intelligence for high-stakes enterprise workflows and multi-step tool execution.
                    </p>
                  </div>
                  {config.behavior.model === "gpt-4o" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        );

      case "theme":
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Accent Color</p>
              <ColorRow label="Accent" value={config.theme.accentColor} onChange={(v) => updateTheme("accentColor", v)} />
              <ColorRow label="Background" value={config.theme.backgroundColor.startsWith("#") ? config.theme.backgroundColor : "#0a0a1a"} onChange={(v) => updateTheme("backgroundColor", v)} />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Frosted Glass</p>
              <SliderRow label="Blur" value={config.theme.glassBlur} min={0} max={40} unit="px" onChange={(v) => updateTheme("glassBlur", v)} />
              <SliderRow label="Opacity" value={config.theme.glassOpacity} min={0} max={80} unit="%" onChange={(v) => updateTheme("glassOpacity", v)} />
              <SliderRow label="Saturation" value={config.theme.glassSaturation} min={80} max={250} onChange={(v) => updateTheme("glassSaturation", v)} />
              <ToggleRow label="Border Glow" value={config.theme.borderGlow} onChange={(v) => updateTheme("borderGlow", v)} />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Launcher</p>
              <div className="flex gap-2">
                {(["circle", "rounded-square", "pill"] as const).map((shape) => (
                  <button key={shape}
                    onClick={() => updateTheme("launcherShape", shape)}
                    className={`flex-1 py-2 text-[10px] rounded-lg border transition-all ${config.theme.launcherShape === shape ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {shape === "circle" ? "●" : shape === "rounded-square" ? "▪" : "━"} {shape}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map((size) => (
                  <button key={size}
                    onClick={() => updateTheme("launcherSize", size)}
                    className={`flex-1 py-2 text-[10px] rounded-lg border transition-all ${config.theme.launcherSize === size ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Background Pattern</p>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "grid", "dots", "ambient-mesh"] as const).map((p) => (
                  <button key={p}
                    onClick={() => updateTheme("bgPattern", p)}
                    className={`py-2 text-[10px] rounded-lg border transition-all ${config.theme.bgPattern === p ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-slate-400"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Shadow Depth</p>
              <SliderRow label="Shadow" value={config.theme.shadowIntensity} min={0} max={100} onChange={(v) => updateTheme("shadowIntensity", v)} />
            </div>
          </div>
        );

      case "typography":
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Font Family</p>
              {(["Plus Jakarta Sans", "Outfit", "Inter", "Playfair Display", "JetBrains Mono", "Space Grotesk", "DM Sans"] as const).map((font) => (
                <button key={font}
                  onClick={() => updateTypography("fontFamily", font)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${config.typography.fontFamily === font ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/8 text-slate-400 hover:border-white/15"}`}
                  style={{ fontFamily: `"${font}", sans-serif` }}>
                  {font}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Bubble Radius</p>
              <SliderRow label="Corner Radius" value={config.typography.bubbleRadius} min={0} max={32} unit="px" onChange={(v) => updateTypography("bubbleRadius", v)} />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Font Size</p>
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map((size) => (
                  <button key={size}
                    onClick={() => updateTypography("fontSize", size)}
                    className={`flex-1 py-2 text-[10px] rounded-lg border transition-all ${config.typography.fontSize === size ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-slate-400"}`}>
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "modules":
        return (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-300">Launcher Label</p>
              <input
                type="text"
                value={config.modules.launcherLabel}
                onChange={(e) => updateModules("launcherLabel", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                placeholder="Need help? ✦"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-300">Input Placeholder</p>
              <input
                type="text"
                value={config.modules.inputPlaceholder}
                onChange={(e) => updateModules("inputPlaceholder", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Welcome Header</p>
              <input
                type="text"
                value={config.modules.welcomeHeader.greeting}
                onChange={(e) => updateModules("welcomeHeader", { ...config.modules.welcomeHeader, greeting: e.target.value })}
                placeholder="Greeting"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={config.modules.welcomeHeader.subtitle}
                onChange={(e) => updateModules("welcomeHeader", { ...config.modules.welcomeHeader, subtitle: e.target.value })}
                placeholder="Subtitle"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={config.modules.welcomeHeader.avatar}
                onChange={(e) => updateModules("welcomeHeader", { ...config.modules.welcomeHeader, avatar: e.target.value })}
                placeholder="Avatar emoji"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300">Rich Components</p>
              <ToggleRow label="Product Cards" value={config.modules.richWidgets.enableProductCards} onChange={(v) => updateRichWidgets("enableProductCards", v)} />
              <ToggleRow label="Status Stepper" value={config.modules.richWidgets.enableStatusStepper} onChange={(v) => updateRichWidgets("enableStatusStepper", v)} />
              <ToggleRow label="Image Cards" value={config.modules.richWidgets.enableImageCards} onChange={(v) => updateRichWidgets("enableImageCards", v)} />
              <ToggleRow label="Checklist" value={config.modules.richWidgets.enableChecklist} onChange={(v) => updateRichWidgets("enableChecklist", v)} />
              <ToggleRow label="Voice Input" value={config.modules.richWidgets.enableVoiceInput} onChange={(v) => updateRichWidgets("enableVoiceInput", v)} />
              <ToggleRow label="File Attachment" value={config.modules.richWidgets.enableFileAttachment} onChange={(v) => updateRichWidgets("enableFileAttachment", v)} />
              <ToggleRow label="Copy / Retry" value={config.modules.richWidgets.enableCopyRetry} onChange={(v) => updateRichWidgets("enableCopyRetry", v)} />
              <ToggleRow label="Typing Dots" value={config.modules.showTypingDots} onChange={(v) => updateModules("showTypingDots", v)} />
            </div>
          </div>
        );

      case "behavior":
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Agent Name</label>
              <input type="text" value={config.behavior.agentName}
                onChange={(e) => updateBehavior("agentName", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">System Prompt</label>
              <textarea value={config.behavior.systemPrompt}
                onChange={(e) => updateBehavior("systemPrompt", e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Fallback Message</label>
              <textarea value={config.behavior.fallbackMessage}
                onChange={(e) => updateBehavior("fallbackMessage", e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <SliderRow label="RAG Confidence Threshold"
              value={Math.round(config.behavior.ragConfidenceThreshold * 100)}
              min={40} max={100} unit="%" step={5}
              onChange={(v) => updateBehavior("ragConfidenceThreshold", v / 100)} />
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-xs font-semibold text-slate-300">Integrations</p>
              <ToggleRow label="Shopify Tool" value={config.behavior.enableShopifyTool} onChange={(v) => updateBehavior("enableShopifyTool", v)} />
              <ToggleRow label="Slack Escalation" value={config.behavior.enableSlackEscalation} onChange={(v) => updateBehavior("enableSlackEscalation", v)} />
              <ToggleRow label="Email Receipts" value={config.behavior.enableEmailReceipts} onChange={(v) => updateBehavior("enableEmailReceipts", v)} />
              <ToggleRow label="Custom Webhooks" value={config.behavior.enableCustomWebhooks} onChange={(v) => updateBehavior("enableCustomWebhooks", v)} />
            </div>
          </div>
        );

      case "embed":
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-300">1-Line Embed Script</p>
              <p className="text-[10px] text-slate-500">Paste this in your website's &lt;head&gt; or before &lt;/body&gt;:</p>
              <div className="relative">
                <pre className="text-[10px] text-emerald-400 bg-slate-900 p-3 rounded-xl overflow-x-auto leading-relaxed border border-white/5">
                  {embedCode}
                </pre>
                <button onClick={handleCopyEmbed}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  {copiedEmbed ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <p className="text-xs font-semibold text-slate-300">Deployment Checklist</p>
              {[
                { label: "Agent configured", done: true },
                { label: "Knowledge base connected", done: false },
                { label: "Embed script installed", done: false },
                { label: "Test conversation sent", done: messages.length > 1 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${item.done ? "bg-emerald-500" : "bg-white/10"}`}>
                    {item.done && <Check size={10} className="text-white" />}
                  </div>
                  <span className={`text-xs ${item.done ? "text-emerald-400" : "text-slate-400"}`}>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {isSaving ? "Saving..." : savedSuccess ? "✓ Saved!" : "Save & Deploy Agent"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Preview Canvas ─────────────────────────────────────────
  const renderPreview = () => {
    switch (deviceFrame) {
      case "website":
        return (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <WebsiteCanvas config={config} messages={messages} onSend={handleSend} />
          </div>
        );

      case "widget":
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f0a1e 100%)" }}>
            <div style={{ width: Math.min(config.layout.width, 380), height: Math.min(config.layout.height, 560) }}>
              <InlineChatbot config={config} messages={messages} onSend={handleSend} chatOpen={true} setChatOpen={() => {}} />
            </div>
          </div>
        );

      case "mobile":
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f0a1e 100%)" }}>
            <div className="relative" style={{ width: 320, height: 640 }}>
              {/* Phone frame */}
              <div className="absolute inset-0 rounded-[44px] border-4 border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 flex justify-center pt-1 z-10">
                  <div className="w-24 h-5 bg-slate-900 rounded-b-2xl" />
                </div>
                <div className="absolute inset-0 pt-6 rounded-[40px] overflow-hidden">
                  <InlineChatbot config={config} messages={messages} onSend={handleSend} chatOpen={true} setChatOpen={() => {}} />
                </div>
              </div>
            </div>
          </div>
        );

      case "tablet":
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f0a1e 100%)" }}>
            <div className="relative" style={{ width: 540, height: 720 }}>
              <div className="absolute inset-0 rounded-[28px] border-4 border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-slate-700 rounded-full" />
                <div className="absolute inset-0 pt-4 rounded-[24px] overflow-hidden">
                  <InlineChatbot config={config} messages={messages} onSend={handleSend} chatOpen={true} setChatOpen={() => {}} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#080b14] text-white overflow-hidden">
      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div className="w-72 flex flex-col border-r border-white/8 flex-shrink-0">
        {/* Left Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/8">
          <button onClick={() => router.push("/dashboard/chatbots")} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
            <ArrowLeft size={16} className="text-slate-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{config.behavior.agentName || "New Chatbot"}</h1>
            <p className="text-[10px] text-slate-500">Chatbot Studio</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: savedSuccess ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)", color: savedSuccess ? "#10b981" : "#818cf8" }}
          >
            {savedSuccess ? <><Check size={12} /> Saved</> : isSaving ? "Saving..." : <><Save size={12} /> Save</>}
          </button>
        </div>

        {/* Left Tabs */}
        <div className="flex border-b border-white/8 overflow-x-auto">
          {LEFT_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[9px] font-semibold transition-all flex-shrink-0 border-b-2 ${
                  activeTab === tab.id ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Left Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderLeftPanel()}
        </div>
      </div>

      {/* ── CENTER PANEL (PREVIEW) ──────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Preview Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {DEVICE_TABS.map((dt) => {
              const Icon = dt.icon;
              return (
                <button
                  key={dt.id}
                  onClick={() => setDeviceFrame(dt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    deviceFrame === dt.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Icon size={13} />
                  {dt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([{ id: `init-${Date.now()}`, sender: "bot", text: config.modules.welcomeHeader.subtitle, time: "Just now" }])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <RefreshCw size={12} /> Reset chat
            </button>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-medium">
              ✦ Live Preview
            </span>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="w-full h-full">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatbotStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-[#080b14] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading Studio...</p>
        </div>
      </div>
    }>
      <ChatbotStudioContent />
    </Suspense>
  );
}