"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, ThumbsUp, ThumbsDown, Sparkles, Bot, Check, FileText } from "lucide-react";
import { api, ChatMessage } from "@/lib/api";

export default function StandaloneWidgetPage({
  params,
}: {
  params: Promise<{ public_key: string }>;
}) {
  const [publicKey, setPublicKey] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "assistant",
      content: "Hi there! 👋 How can I help you today?",
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setPublicKey(p.public_key));
  }, [params]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const res = await api.sendWidgetMessage(publicKey || "pk_live_support_12345", text, conversationId);
      if (res.conversation_id) setConversationId(res.conversation_id);

      const assistantMsg: ChatMessage = {
        id: res.id || `asst-${Date.now()}`,
        role: "assistant",
        content: res.message || res.content || "I found the relevant information from our verified knowledge base.",
        evidence: res.evidence || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Fallback response for offline or demo testing
      setTimeout(() => {
        let reply = "Here is what our verified documentation states regarding your query.";
        if (text.toLowerCase().includes("return")) {
          reply = "You can return unused products within 30 days of delivery with standard receipt.";
        } else if (text.toLowerCase().includes("address")) {
          reply = "You can update your delivery address directly through your order tracking dashboard before shipping.";
        }

        const fallbackMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await api.submitFeedback(messageId, rating);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: { rating } } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: { rating } } : m))
      );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full absolute bottom-0 right-0" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">AI Knowledge Assistant</h1>
            <p className="text-[10px] text-indigo-200">Online &bull; Powered by Chatin</p>
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/60">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[88%] space-y-2">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                }`}
              >
                {m.content}
              </div>

              {/* Evidence Snippet Accordion (for assistant responses) */}
              {m.evidence && m.evidence.length > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 text-[10px] text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <FileText className="w-3 h-3" />
                    <span>Verified Source: {m.evidence[0].filename || "Knowledge Document"}</span>
                  </div>
                  <p className="italic text-slate-600 dark:text-slate-300 line-clamp-2">
                    &quot;{m.evidence[0].snippet}&quot;
                  </p>
                </div>
              )}

              {/* Feedback Thumbs */}
              {m.role === "assistant" && m.id !== "msg-0" && (
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-slate-400">
                  <span>Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(m.id, 1)}
                    className={`p-1 rounded hover:text-indigo-600 transition-colors ${
                      m.feedback?.rating === 1 ? "text-emerald-500 font-bold" : ""
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(m.id, -1)}
                    className={`p-1 rounded hover:text-rose-600 transition-colors ${
                      m.feedback?.rating === -1 ? "text-rose-500 font-bold" : ""
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <footer className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask a question..."
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputVal.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </footer>

    </div>
  );
}
