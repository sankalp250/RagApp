"use client";
import React, { useState, useCallback } from "react";
import { ChatbotThemeConfig, ChatMessage } from "@/types/chatbot-studio";
import { ChatLauncher } from "./ChatLauncher";
import { ChatWindow } from "./ChatWindow";

interface ChatbotRendererProps {
  config: ChatbotThemeConfig;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  defaultOpen?: boolean;
  positionClass?: string;
}

export function ChatbotRenderer({ config, messages, onSend, defaultOpen = false, positionClass }: ChatbotRendererProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const posMap = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    center: "bottom-6 right-6",
  };

  const pos = positionClass || posMap[config.layout.position];

  return (
    <div className={`fixed ${pos} flex flex-col items-end gap-3 z-50`}>
      {/* Chat window */}
      <ChatWindow
        config={config}
        messages={messages}
        onSend={onSend}
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
      />
      {/* Launcher button */}
      <ChatLauncher config={config} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
    </div>
  );
}