"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { ChatbotThemeConfig } from "@/types/chatbot-studio";

interface ChatLauncherProps {
  config: ChatbotThemeConfig;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatLauncher({ config, isOpen, onToggle }: ChatLauncherProps) {
  const { theme, modules } = config;

  const sizeMap = { sm: "h-12 w-12", md: "h-14 w-14", lg: "h-16 w-16" };
  const shapeMap = {
    circle: "rounded-full",
    "rounded-square": "rounded-2xl",
    pill: "rounded-full px-5 min-w-[140px]",
  };

  const isPill = theme.launcherShape === "pill";

  return (
    <div className="flex flex-col items-end gap-3">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 max-w-[200px]"
          >
            <p className="text-xs font-semibold text-slate-700 truncate">{modules.launcherLabel}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        style={{ background: theme.launcherBg, color: theme.launcherText }}
        className={`relative flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 ${
          sizeMap[theme.launcherSize]
        } ${shapeMap[theme.launcherShape]}`}
      >
        {/* Pulse ring */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-[inherit] opacity-40"
            style={{ background: theme.launcherBg }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
              <MessageCircle size={isPill ? 18 : 22} />
              {isPill && <span className="text-sm font-semibold whitespace-nowrap">{modules.launcherLabel}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
