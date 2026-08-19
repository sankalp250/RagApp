"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  KeyRound,
  Users,
  CreditCard,
  Lock,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const apiKey = "chatin_live_948fba819283f019a82";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Organization & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your API credentials, multi-tenant isolation, team access, and subscription plan.
        </p>
      </div>

      {/* Plan & Subscription Card */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Enterprise Cloud Plan</h3>
              <p className="text-xs text-slate-500">Dedicated vector cluster & multi-tenant isolation</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs font-medium pt-2">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Usage</span>
            <span className="text-sm font-bold text-slate-900">128,430 / Unlimited</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Vector Chunks</span>
            <span className="text-sm font-bold text-slate-900">2,438 / 500,000</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">SLA Guarantee</span>
            <span className="text-sm font-bold text-emerald-600">99.98% Uptime</span>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">API Access Token</h3>
            <p className="text-xs text-slate-500">Use this token to authenticate widget scripts and backend REST tools</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 px-3 text-xs bg-transparent border-none focus:outline-none font-mono text-slate-800 font-bold"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              setApiKeyCopied(true);
              setTimeout(() => setApiKeyCopied(false), 2000);
            }}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            {apiKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{apiKeyCopied ? "Copied" : "Copy Token"}</span>
          </button>
        </div>
      </div>

      {/* Security & Data Governance */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Security & Privacy Governance</h3>
            <p className="text-xs text-slate-500">Strict zero-retention policies for foundation model training</p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span>Multi-Tenant Collection Isolation</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span>Zero Foundation Model Training Retention</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span>End-to-End TLS 1.3 & AES-256 Ingestion Encryption</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
