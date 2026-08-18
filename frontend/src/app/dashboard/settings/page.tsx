"use client";

import React, { useState } from "react";
import { Settings, Shield, Key, Building, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Acme Corp");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Settings &amp; Configuration</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your organization profile, team members, rate limits, and API keys.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Building className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Organization Profile</h3>
              <p className="text-[11px] text-slate-400">Your organization name and slug identifier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <Input
              label="Organization Slug"
              value="acme-corp"
              disabled
            />
          </div>

          <Button onClick={handleSave} variant="gradient" size="sm">
            {saved ? "Changes Saved!" : "Save Changes"}
          </Button>
        </div>

        {/* API Keys Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Key className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">API Authentication Keys</h3>
              <p className="text-[11px] text-slate-400">Secret keys for REST API and programmatic vector uploads</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Production Secret Key</p>
                <p className="text-[11px] font-mono text-slate-400">sk_live_98a7sd********************41fa</p>
              </div>
              <Button variant="outline" size="sm">
                Revoke &amp; Rotate
              </Button>
            </div>
          </div>
        </div>

        {/* Rate Limiting & Guardrails */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Rate Limits &amp; Security Guardrails</h3>
              <p className="text-[11px] text-slate-400">Configured Upstash Redis token-bucket policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <span className="font-bold text-white">Public Chat Widget Limit</span>
              <p className="text-slate-400">30 requests / minute per client IP</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
              <span className="font-bold text-white">Authenticated Dashboard API</span>
              <p className="text-slate-400">120 requests / minute per organization</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
