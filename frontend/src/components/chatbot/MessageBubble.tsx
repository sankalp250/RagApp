"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from "lucide-react";
import { ChatMessage, ChatbotThemeConfig } from "@/types/chatbot-studio";
import { BlockRenderer } from "./BlockRenderer";

interface MessageBubbleProps {
  msg: ChatMessage;
  config: ChatbotThemeConfig;
}

export function MessageBubble({ msg, config }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.sender === "user";
  const { theme, typography } = config;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isGlass = theme.glassBlur > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Bot Avatar */}
      {!isUser && config.modules.welcomeHeader.showAvatar && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
          style={{ background: theme.primaryGradient }}
        >
          {config.modules.welcomeHeader.avatar}
        </div>
      )}

      <div className={`group flex flex-col gap-1 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        {msg.isTyping ? (
          <div
            className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
            style={{
              background: theme.botBubbleBg,
              color: theme.botBubbleText,
              borderRadius: typography.bubbleRadius,
              ...(isGlass ? { backdropFilter: `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%)`, border: "1px solid rgba(255,255,255,0.15)" } : {}),
            }}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : msg.blocks && msg.blocks.length > 0 ? (
          <div className="flex flex-col gap-2 w-full">
            {/* Text portion */}
            {msg.text && (
              <div
                className="px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: isUser ? theme.userBubbleBg : theme.botBubbleBg,
                  color: isUser ? theme.userBubbleText : theme.botBubbleText,
                  borderRadius: typography.bubbleRadius,
                  ...(isGlass && !isUser ? { backdropFilter: `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%)`, border: "1px solid rgba(255,255,255,0.15)" } : {}),
                }}
              >
                {msg.text}
              </div>
            )}
            {/* Rich blocks */}
            {msg.blocks.map((block, i) => (
              <BlockRenderer key={i} block={block} config={config} />
            ))}
          </div>
        ) : (
          <div
            className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: isUser ? theme.userBubbleBg : theme.botBubbleBg,
              color: isUser ? theme.userBubbleText : theme.botBubbleText,
              borderRadius: typography.bubbleRadius,
              ...(isGlass && !isUser ? { backdropFilter: `blur(${theme.glassBlur}px) saturate(${theme.glassSaturation}%)`, border: "1px solid rgba(255,255,255,0.12)" } : {}),
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Hover Actions */}
        {!isUser && !msg.isTyping && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1">
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Copy">
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="opacity-50" />}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ThumbsUp size={12} className="opacity-50" /></button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><ThumbsDown size={12} className="opacity-50" /></button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><RotateCcw size={12} className="opacity-50" /></button>
          </div>
        )}

        <span className="text-[10px] opacity-30 px-1">{msg.time}</span>
      </div>
    </motion.div>
  );
}