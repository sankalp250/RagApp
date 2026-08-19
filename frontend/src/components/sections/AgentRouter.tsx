"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Bot,
  ShoppingBag,
  MessageSquare,
  Mail,
  Webhook,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { fadeUp } from "@/lib/animation";

const AGENT_DEMOS = [
  {
    id: "shopify",
    title: "E-Commerce & Orders",
    icon: ShoppingBag,
    color: "from-emerald-500 to-teal-600",
    accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    userPrompt: "Where is my order #8491?",
    agentAction: "Shopify API → orders.get(8491)",
    output: "Order #8491 was dispatched yesterday via FedEx. Tracking: FX-90812389. Estimated arrival tomorrow by 4:00 PM.",
    toolStatus: "Executed in 120ms",
  },
  {
    id: "slack",
    title: "Support Escalation",
    icon: MessageSquare,
    color: "from-purple-600 to-indigo-600",
    accentBg: "bg-purple-50 text-purple-700 border-purple-200",
    userPrompt: "I need to speak with a senior human manager about an invoice error.",
    agentAction: "Slack API → chat.postMessage(#tier2-support)",
    output: "I have escalated this ticket to our senior billing lead Sarah on Slack with full context attached. She will reply in 5 minutes.",
    toolStatus: "Ticket #4912 Created",
  },
  {
    id: "gmail",
    title: "Email & Receipts",
    icon: Mail,
    color: "from-blue-500 to-cyan-600",
    accentBg: "bg-blue-50 text-blue-700 border-blue-200",
    userPrompt: "Can you email me the updated tax invoice for last quarter?",
    agentAction: "Stripe & Gmail API → invoices.sendEmail()",
    output: "I just sent the Q3 tax invoice PDF directly to alex@company.com with all VAT breakdowns attached.",
    toolStatus: "Email Delivered",
  },
  {
    id: "custom",
    title: "Custom Webhooks",
    icon: Webhook,
    color: "from-pink-500 to-rose-600",
    accentBg: "bg-pink-50 text-pink-700 border-pink-200",
    userPrompt: "Pause my enterprise account until next month.",
    agentAction: "Internal REST API → POST /v1/subscriptions/pause",
    output: "Subscription has been paused until July 1st. Access will automatically resume with zero data deletion.",
    toolStatus: "200 OK Returned",
  },
];

export function AgentRouter() {
  const [selectedDemo, setSelectedDemo] = useState(0);

  // Auto-cycle through tool router demos continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedDemo((prev) => (prev + 1) % AGENT_DEMOS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const active = AGENT_DEMOS[selectedDemo];
  const Icon = active.icon;

  return (
    <section id="agents" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="ACTION-ORIENTED AI AGENTS (AUTO-PLAYING)"
        title="More Than Just Text Answers."
        highlightText="Autonomous Tool Execution."
        description="Your AI agents don't stop at answering questions. They safely interact with your tech stack to look up customer records, trigger workflows, and automate actions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Selector Column */}
        <div className="lg:col-span-5 space-y-3">
          {AGENT_DEMOS.map((demo, idx) => {
            const DemoIcon = demo.icon;
            const isSelected = selectedDemo === idx;
            return (
              <motion.button
                key={demo.id}
                onClick={() => setSelectedDemo(idx)}
                whileHover={{ scale: 1.01 }}
                className={`w-full p-4.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                    : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${demo.color} flex items-center justify-center text-white shadow-xs`}
                  >
                    <DemoIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{demo.title}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{demo.agentAction}</p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    isSelected ? "text-indigo-600 translate-x-1" : "text-slate-400"
                  }`}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Right Execution Simulator Window (Clean Light Glass) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 text-slate-900 border border-indigo-100 shadow-xl shadow-indigo-500/5 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${active.color} flex items-center justify-center text-white shadow-xs`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{active.title} Agent</h5>
                    <p className="text-[11px] text-slate-500 font-medium">Guarded Tool Calling Engine</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${active.accentBg}`}>
                  {active.toolStatus}
                </span>
              </div>

              {/* User Prompt */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">
                  Customer Prompt
                </div>
                <p className="text-sm text-slate-900 font-medium">&ldquo;{active.userPrompt}&rdquo;</p>
              </div>

              {/* Tool Execution Step */}
              <div className="p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200/70 text-xs font-mono flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-indigo-900 font-bold">INVOKED: </span>
                  <span className="text-slate-700 font-semibold">{active.agentAction}</span>
                </div>
              </div>

              {/* Agent Final Output */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Agent Response
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">{active.output}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
