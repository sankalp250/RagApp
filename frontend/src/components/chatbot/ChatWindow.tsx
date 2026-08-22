"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, X, MoreHorizontal } from "lucide-react";
import { ChatbotThemeConfig, ChatMessage } from "@/types/chatbot-studio";
import { MessageBubble } from "./MessageBubble";
import { BlockRenderer } from "./BlockRenderer";
import { InputBar } from "./InputBar";

interface ChatWindowProps {
  config: ChatbotThemeConfig;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  isOpen: boolean;
  style?: React.CSSProperties;
}

export function ChatWindow({ config, messages, onSend, onClose, isOpen, style }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, typography, modules } = config;
  const isGlass = theme.glassBlur > 0;
  const isDark = theme.backgroundColor.startsWith("rgba(15") || theme.backgroundColor === "#030712" || theme.backgroundColor.startsWith("rgba(0");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const windowStyle: React.CSSProperties = {
    background: isGlass
      ? `${theme.backgroundColor}`
      : theme.backgroundColor,
    backdropFilter: isGlass ? `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%)` : undefined,
    WebkitBackdropFilter: isGlass ? `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%)` : undefined,
    border: isGlass ? "1px solid rgba(255,255,255,0.15)" : `1px solid rgba(0,0,0,0.08)`,
    borderRadius: 24,
    width: config.layout.width,
    maxHeight: config.layout.height,
    boxShadow: `0 ${theme.shadowIntensity / 3}px ${theme.shadowIntensity * 2}px rgba(0,0,0,${theme.shadowIntensity / 150})`,
    fontFamily: `"${typography.fontFamily}", sans-serif`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    ...style,
  };

  const showWelcome = messages.length <= 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20, transformOrigin: "bottom right" }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={windowStyle}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{ background: theme.primaryGradient }}
          >
            {modules.welcomeHeader.showAvatar && (
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0 ring-2 ring-white/30">
                {modules.welcomeHeader.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{config.behavior.agentName}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-white/70">{modules.welcomeHeader.statusBadge}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                <MoreHorizontal size={16} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth"
            style={{ minHeight: 0 }}
          >
            {/* Welcome state */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 mb-2"
              >
                {/* Greeting */}
                <div className="text-center py-3">
                  {modules.welcomeHeader.showUserGreeting && (
                    <p className="text-xs font-medium opacity-50 mb-0.5" style={{ color: theme.botBubbleText }}>
                      {modules.welcomeHeader.greeting}
                    </p>
                  )}
                  <h2
                    className="text-base font-bold"
                    style={{ color: theme.botBubbleText, fontWeight: typography.titleWeight === "black" ? 900 : typography.titleWeight === "bold" ? 700 : 500 }}
                  >
                    {modules.welcomeHeader.showUserGreeting ? modules.welcomeHeader.greeting : modules.welcomeHeader.subtitle}
                  </h2>
                  {modules.welcomeHeader.showUserGreeting && (
                    <p className="text-xs opacity-50 mt-0.5" style={{ color: theme.botBubbleText }}>
                      {modules.welcomeHeader.subtitle}
                    </p>
                  )}
                </div>

                {/* Category pills */}
                {modules.categoryPills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {modules.categoryPills.map((pill, i) => (
                      <button
                        key={i}
                        onClick={() => onSend(pill)}
                        className="px-3 py-1.5 text-xs rounded-full font-medium transition-all hover:scale-105"
                        style={{
                          background: i === 0 ? theme.accentColor : "rgba(255,255,255,0.1)",
                          color: i === 0 ? "#fff" : theme.botBubbleText,
                        }}
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action cards */}
                {modules.featuredActionCards.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {modules.featuredActionCards.slice(0, 4).map((card) => (
                      <button
                        key={card.id}
                        onClick={() => onSend(card.actionPrompt)}
                        className="p-3 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-1"
                        style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <span className="text-xl">{card.icon}</span>
                        <p className="text-xs font-semibold leading-tight" style={{ color: theme.botBubbleText }}>{card.title}</p>
                        <p className="text-[10px] opacity-50" style={{ color: theme.botBubbleText }}>{card.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} config={config} />
            ))}

            {/* Quick prompts */}
            {showWelcome && modules.quickPrompts.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                <p className="text-[10px] opacity-40 font-medium" style={{ color: theme.botBubbleText }}>Try asking...</p>
                {modules.quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(prompt)}
                    className="text-left px-3 py-2 rounded-xl text-xs transition-all hover:scale-[1.01]"
                    style={{
                      background: theme.cardBg,
                      color: theme.botBubbleText,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {prompt} →
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <InputBar config={config} onSend={onSend} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}