"use client";

import { useEffect } from "react";

export interface RagChatbotProps {
  agentId: string;
  apiUrl?: string;
  theme?: "light" | "dark" | "auto";
  position?: "bottom-right" | "bottom-left";
}

/**
 * RagChatbot — Universal React & Next.js wrapper component for the RAG Assistant Widget.
 * Works seamlessly in React 18/19, Next.js 13/14/15 (App Router & Pages Router), Vite, and Remix.
 * 
 * Usage:
 * ```tsx
 * import { RagChatbot } from "@/components/RagChatbot";
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <div>
 *       {children}
 *       <RagChatbot 
 *         agentId="YOUR_AGENT_ID" 
 *         apiUrl="https://api.yourdomain.com" 
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function RagChatbot({
  agentId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  theme = "auto",
  position = "bottom-right",
}: RagChatbotProps) {
  useEffect(() => {
    // Avoid double injection
    const SCRIPT_ID = `rag-widget-script-${agentId}`;
    if (document.getElementById(SCRIPT_ID)) return;

    const cleanApiUrl = apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${cleanApiUrl}/widget.js`;
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-api-url", cleanApiUrl);
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-position", position);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      // Optional cleanup on component unmount
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        existing.remove();
      }
      const existingContainer = document.getElementById("ai-rag-widget-container");
      if (existingContainer) {
        existingContainer.remove();
      }
    };
  }, [agentId, apiUrl, theme, position]);

  return null;
}

export default RagChatbot;
