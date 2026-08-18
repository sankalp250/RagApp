"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Share2, Layers, MessageSquare, Zap } from "lucide-react";

export function Integrations() {
  const cards = [
    {
      num: "01",
      badge: "Knowledge Synchronization",
      title: "Amplify Your AI Reach",
      desc: "Connect multiple data sources across teams and keep vector indexes automatically synchronized in real time.",
      bg: "from-orange-500 via-rose-500 to-pink-500",
      textColor: "text-white",
    },
    {
      num: "02",
      badge: "Multi-Agent Orchestration",
      title: "Connect, Manage, and Analyze",
      desc: "Deploy tailored chatbots for sales, customer support, and internal operations from a single unified control center.",
      bg: "from-purple-600 via-pink-500 to-rose-400",
      textColor: "text-white",
    },
    {
      num: "03",
      badge: "Omnichannel Delivery",
      title: "Centralize & Streamline Messages",
      desc: "Deliver answers instantly via embeddable web widgets, Slack bots, Zendesk apps, or custom webhook integrations.",
      bg: "from-indigo-600 via-purple-700 to-violet-800",
      textColor: "text-white",
    },
  ];

  const appIntegrations = [
    { name: "Slack", icon: "💬", color: "bg-emerald-50 text-emerald-700" },
    { name: "Zendesk", icon: "🎧", color: "bg-amber-50 text-amber-700" },
    { name: "Notion", icon: "📝", color: "bg-slate-100 text-slate-800" },
    { name: "Intercom", icon: "⚡", color: "bg-blue-50 text-blue-700" },
    { name: "Shopify", icon: "🛍️", color: "bg-lime-50 text-lime-700" },
    { name: "WhatsApp", icon: "📱", color: "bg-emerald-50 text-emerald-700" },
    { name: "HubSpot", icon: "🎯", color: "bg-orange-50 text-orange-700" },
    { name: "Zapier", icon: "🔄", color: "bg-rose-50 text-rose-700" },
  ];

  return (
    <section id="integrations" className="py-24 relative overflow-hidden bg-slate-900 text-white">
      {/* Background Glowing Mesh */}
      <div className="orb-purple w-[600px] h-[600px] -top-20 -right-20 opacity-30" />
      <div className="orb-blue w-[500px] h-[500px] -bottom-20 -left-20 opacity-25" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-bold text-indigo-300 mb-4">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Ecosystem Connectivity</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Integrations
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Plug Chatin into your current tech stack with zero engineering overhead.
          </p>
        </div>

        {/* 3 High-Impact Glowing Cards (01, 02, 03) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative rounded-3xl p-8 bg-gradient-to-br ${card.bg} shadow-2xl shadow-indigo-950/50 flex flex-col justify-between min-h-[360px] overflow-hidden group cursor-pointer`}
            >
              {/* Inner Decorative Shapes */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white">
                    {card.badge}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:rotate-45 transition-transform duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white leading-tight mb-3">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6 border-t border-white/20 flex items-center justify-between">
                <span className="text-5xl font-black tracking-tight text-white/90">
                  {card.num}
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:underline">
                  Explore &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating App Badges */}
        <div className="pt-8 border-t border-slate-800">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Connects seamlessly with all your favorite tools
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {appIntegrations.map((app, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.06, y: -2 }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md shadow-md cursor-pointer"
              >
                <span className="text-xl">{app.icon}</span>
                <span className="text-sm font-bold text-white">{app.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
