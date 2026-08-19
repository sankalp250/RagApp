"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles, RefreshCw, ShoppingBag, ArrowRight } from "lucide-react";
import { ChatMessage } from "@/types";

const SIMULATED_STORY = [
  {
    sender: "user",
    text: "Where is my order #8491?",
    action: "Shopify API → Order Lookup",
    botReply: "Order #8491 shipped via FedEx yesterday! 📦 Estimated delivery is tomorrow by 4:00 PM. Would you like live SMS tracking?",
  },
  {
    sender: "user",
    text: "Can I change my delivery address to our new office?",
    action: "Knowledge Gap → Courier Redirect Engine",
    botReply: "Since the package is in transit, courier rerouting requires a quick carrier authorization. I can file this redirect request for you now!",
  },
  {
    sender: "user",
    text: "Yes please, redirect to 500 Market St, Suite 400.",
    action: "FedEx API → Address Updated",
    botReply: "✓ Done! FedEx confirmed the new destination: 500 Market St. Tracking status updated across all systems.",
  },
];

export function HeroFloatingWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "bot",
      text: "Hi there! 👋 I'm your AI agent trained on your business. How can I help you today?",
      timestamp: "Just now",
    },
  ]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ONLY the internal chat container (never scrolls the parent page/window)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // Auto-play conversation sequence smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (storyIndex < SIMULATED_STORY.length) {
        const current = SIMULATED_STORY[storyIndex];

        // 1. Show user message
        setMessages((prev) => [
          ...prev,
          {
            id: `u-${storyIndex}-${Date.now()}`,
            sender: "user",
            text: current.text,
            timestamp: "Just now",
          },
        ]);

        setIsTyping(true);

        // 2. After 1s, show bot reply
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `b-${storyIndex}-${Date.now()}`,
              sender: "bot",
              text: current.botReply,
              timestamp: "Just now",
              metadata: { actionTaken: current.action },
            },
          ]);

          setStoryIndex((prev) => prev + 1);
        }, 1200);
      } else {
        // Reset and loop after 5 seconds
        setTimeout(() => {
          setMessages([
            {
              id: "m0",
              sender: "bot",
              text: "Hi there! 👋 I'm your AI agent trained on your business. How can I help you today?",
              timestamp: "Just now",
            },
          ]);
          setStoryIndex(0);
        }, 4000);
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [storyIndex]);

  const handleManualSend = (text?: string) => {
    const query = text || inputText;
    if (!query.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `man-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp: "Just now",
      },
    ]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `man-bot-${Date.now()}`,
          sender: "bot",
          text: "I found this in your indexed documentation! Everything is grounded with zero hallucinations.",
          timestamp: "Just now",
          metadata: { actionTaken: "Hybrid RAG Engine · 99.4% Match" },
        },
      ]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-sm rounded-[32px] bg-white/95 backdrop-blur-2xl border border-indigo-100 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.18)] overflow-hidden flex flex-col pointer-events-auto select-none"
    >
      {/* Widget Header with colorful gradient */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {/* Glowing Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md p-[2px] shadow-sm flex items-center justify-center">
              <Bot className="w-5 h-5 text-white animate-bounce [animation-duration:3s]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-purple-700 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white">Chatin Assistant</h4>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <p className="text-[11px] text-white/80 flex items-center gap-1">
              <span>● Auto-Playing Demo</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: "m0",
                sender: "bot",
                text: "Hi there! 👋 I'm your AI agent trained on your business. How can I help you today?",
                timestamp: "Just now",
              },
            ]);
            setStoryIndex(0);
          }}
          className="p-1.5 rounded-full hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
          title="Replay Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="p-4 space-y-3 max-h-[290px] min-h-[260px] overflow-y-auto scroll-smooth bg-gradient-to-b from-slate-50/60 to-indigo-50/20"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>

              {/* Action pill */}
              {msg.metadata?.actionTaken && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 text-[10px] font-bold text-indigo-700 shadow-2xs"
                >
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  {msg.metadata.actionTaken}
                </motion.span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Animated typing dots */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-none w-16 shadow-xs"
          >
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" />
          </motion.div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 bg-white/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleManualSend("Can I change my delivery address?")}
          className="shrink-0 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-[11px] font-semibold text-indigo-700 border border-indigo-100 transition-colors cursor-pointer"
        >
          Delivery address?
        </button>
        <button
          onClick={() => handleManualSend("Where is my order #8491?")}
          className="shrink-0 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[11px] font-semibold text-purple-700 border border-purple-100 transition-colors cursor-pointer"
        >
          Track package
        </button>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualSend()}
          placeholder="Ask anything..."
          className="flex-1 px-3.5 py-2 text-xs bg-slate-100/80 rounded-full border border-transparent focus:border-indigo-400 focus:bg-white focus:outline-none transition-all"
        />
        <button
          onClick={() => handleManualSend()}
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white flex items-center justify-center shadow-md hover:opacity-90 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
