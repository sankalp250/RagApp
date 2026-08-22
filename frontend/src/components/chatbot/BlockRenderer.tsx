"use client";
import React from "react";
import { ChatBlock, ChatbotThemeConfig } from "@/types/chatbot-studio";
import { Star, Download, CheckCircle2, Circle, ChevronRight } from "lucide-react";

interface BlockRendererProps {
  block: ChatBlock;
  config: ChatbotThemeConfig;
  onPrompt?: (text: string) => void;
}

export function BlockRenderer({ block, config, onPrompt }: BlockRendererProps) {
  const { theme } = config;

  switch (block.type) {
    case "quick-actions":
      return (
        <div className="flex flex-wrap gap-2">
          {block.items.map((item, i) => (
            <button
              key={i}
              onClick={() => onPrompt?.(item.prompt)}
              className="px-3 py-1.5 text-xs rounded-full border transition-all hover:scale-105 font-medium"
              style={{ borderColor: theme.accentColor, color: theme.accentColor, background: "transparent" }}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      );

    case "category-pills":
      return (
        <div className="flex flex-wrap gap-2">
          {block.pills.map((pill, i) => (
            <button
              key={i}
              onClick={() => onPrompt?.(pill.label)}
              className="px-3 py-1.5 text-xs rounded-full font-medium transition-all hover:scale-105"
              style={{
                background: pill.active ? theme.accentColor : "rgba(255,255,255,0.1)",
                color: pill.active ? "#fff" : theme.botBubbleText,
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      );

    case "product-card":
      return (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {block.products.map((p) => (
            <div
              key={p.id}
              className="flex-shrink-0 w-44 rounded-2xl overflow-hidden snap-start"
              style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl relative">
                🛍️
                {p.badge && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: theme.accentColor }}>
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold truncate mb-1" style={{ color: theme.botBubbleText }}>{p.title}</p>
                <div className="flex items-center gap-1 mb-2">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="text-[10px] opacity-60">{p.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{ color: theme.accentColor }}>{p.price}</p>
                    {p.originalPrice && <p className="text-[10px] line-through opacity-40">{p.originalPrice}</p>}
                  </div>
                </div>
                <button
                  className="w-full mt-2 py-1.5 rounded-xl text-[11px] font-semibold text-white"
                  style={{ background: theme.accentColor }}
                >
                  {p.ctaLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      );

    case "product-carousel":
      return (
        <div>
          {block.title && <p className="text-xs font-semibold opacity-60 mb-2">{block.title}</p>}
          <BlockRenderer block={{ type: "product-card", products: block.products }} config={config} onPrompt={onPrompt} />
        </div>
      );

    case "media-gallery":
      return (
        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
          {block.images.slice(0, 3).map((img, i) => (
            <div key={i} className="relative aspect-square bg-slate-200 flex items-center justify-center overflow-hidden rounded-lg">
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
              {i === 2 && block.overflow && block.overflow > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                  +{block.overflow}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case "document-card":
      const fileIconMap: Record<string, string> = { pdf: "📄", csv: "📊", docx: "📝", xlsx: "📊", txt: "📃", other: "📎" };
      return (
        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="text-2xl">{fileIconMap[block.fileType] || "📎"}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: theme.botBubbleText }}>{block.fileName}</p>
            <p className="text-[10px] opacity-50">{block.fileSize}</p>
          </div>
          <button
            className="flex-shrink-0 p-2 rounded-xl"
            style={{ background: theme.accentColor + "20", color: theme.accentColor }}
          >
            <Download size={14} />
          </button>
        </div>
      );

    case "status-stepper":
      return (
        <div
          className="p-4 rounded-2xl flex flex-col gap-3"
          style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {block.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step.status === "done" ? theme.accentColor : step.status === "active" ? theme.accentColor + "40" : "rgba(255,255,255,0.1)",
                    color: step.status !== "pending" ? (step.status === "done" ? "#fff" : theme.accentColor) : "rgba(255,255,255,0.3)",
                  }}
                >
                  {step.status === "done" ? <CheckCircle2 size={14} /> : step.status === "active" ? <div className="w-2 h-2 rounded-full bg-current animate-pulse" /> : <Circle size={14} />}
                </div>
                {i < block.steps.length - 1 && (
                  <div className="w-0.5 h-4 mt-1" style={{ background: step.status === "done" ? theme.accentColor : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: step.status !== "pending" ? theme.botBubbleText : theme.botBubbleText + "60" }}>{step.label}</p>
                {step.timestamp && <p className="text-[10px] opacity-40">{step.timestamp}</p>}
              </div>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div
          className="p-4 rounded-2xl flex flex-col gap-2"
          style={{ background: theme.cardBg, border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: item.done ? theme.accentColor : "rgba(255,255,255,0.1)" }}
              >
                {item.done && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <p
                className={`text-xs ${item.done ? "line-through opacity-50" : ""}`}
                style={{ color: theme.botBubbleText }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      );

    case "weather":
      return (
        <div
          className="p-4 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #1e3a5f, #0f2040)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{block.temp}</p>
              <p className="text-sm text-white/80">{block.condition}</p>
              <p className="text-xs text-white/50">{block.location}</p>
            </div>
            <div className="text-4xl">{block.icon || "🌤️"}</div>
          </div>
        </div>
      );

    case "text":
      return <p className="text-sm" style={{ color: config.theme.botBubbleText }}>{block.content}</p>;

    case "markdown":
      return <p className="text-sm whitespace-pre-wrap" style={{ color: config.theme.botBubbleText }}>{block.content}</p>;

    case "tool-result":
      return (
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: theme.cardBg, border: `1px solid ${theme.accentColor}40` }}
        >
          <p className="font-semibold mb-1" style={{ color: theme.accentColor }}>⚡ {block.toolName}</p>
          <p className="opacity-70" style={{ color: theme.botBubbleText }}>{block.summary}</p>
        </div>
      );

    default:
      return null;
  }
}