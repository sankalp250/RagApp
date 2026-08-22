"use client";
import React, { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import { ChatbotThemeConfig } from "@/types/chatbot-studio";
import { motion } from "framer-motion";

interface InputBarProps {
  config: ChatbotThemeConfig;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({ config, onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, modules } = config;

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = value.trim().length > 0;

  return (
    <div
      className="px-3 py-3 border-t"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
        style={{
          background: theme.glassBlur > 0 ? "rgba(255,255,255,0.08)" : theme.backgroundColor === "#ffffff" ? "#f3f4f6" : "rgba(255,255,255,0.06)",
          border: `1px solid ${theme.glassBlur > 0 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        {modules.richWidgets.enableFileAttachment && (
          <button className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
            <Paperclip size={16} style={{ color: theme.botBubbleText }} />
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder={modules.inputPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40 min-w-0"
          style={{ color: theme.botBubbleText, fontFamily: "inherit" }}
        />

        {modules.richWidgets.enableVoiceInput && !hasText && (
          <button className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
            <Mic size={16} style={{ color: theme.botBubbleText }} />
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!hasText || disabled}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: hasText && !disabled ? theme.accentColor : "rgba(255,255,255,0.1)",
            opacity: hasText && !disabled ? 1 : 0.5,
          }}
        >
          <Send size={14} className="text-white" />
        </motion.button>
      </div>
    </div>
  );
}