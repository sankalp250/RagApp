"use client";

import React, { useState } from "react";
import {
  Layers,
  ShoppingBag,
  MessageSquare,
  Mail,
  Headphones,
  FileText,
  Radio,
  CreditCard,
  Webhook,
  CheckCircle2,
  Plus,
  ExternalLink,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { INTEGRATIONS_LIST } from "@/lib/data";

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  MessageSquare,
  Mail,
  Headphones,
  FileText,
  Radio,
  CreditCard,
  Webhook,
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS_LIST);

  const toggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Connected" ? "Available" : "Connected",
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Integrations & Guarded Tools
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Connect external tools, e-commerce stores, CRMs, and internal communication channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guarded Execution Sandbox</span>
          </span>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {integrations.map((item) => {
          const Icon = ICON_MAP[item.icon] || Webhook;
          const isConnected = item.status === "Connected";
          return (
            <div
              key={item.id}
              className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-indigo-300 hover:shadow-xl transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Coming Soon</span>
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-600 flex justify-between">
                  <span>Action Type:</span>
                  <span className="text-indigo-600 font-bold">{item.actionType}</span>
                </div>
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100/80 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Coming Soon</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
