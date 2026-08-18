"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, Sparkles } from "lucide-react";

export function ImpactCallouts() {
  const callouts = [
    {
      badge: "Users Scaled",
      badgeColor: "bg-orange-500",
      value: "+270K",
      icon: Users,
      title: "Intelligent Real-Time Understanding",
      desc: "Our hybrid dense + sparse pgvector RAG pipeline understands subtle user intent across millions of sessions without degradation.",
      gradient: "from-purple-900 to-indigo-900",
    },
    {
      badge: "Increase In Traffic",
      badgeColor: "bg-pink-500",
      value: "8X",
      icon: TrendingUp,
      title: "Actionable Insights & Discovery",
      desc: "Track and analyze high-intent topics. Pinpoint exact questions customers ask that drive conversions and engagement.",
      gradient: "from-indigo-900 to-blue-900",
    },
    {
      badge: "Saved Weekly",
      badgeColor: "bg-indigo-500",
      value: "+40h",
      icon: Clock,
      title: "Automated Self-Healing Knowledge",
      desc: "Effortlessly save engineering hours with automated document chunking, semantic caching, and 1-click AI gap resolution.",
      gradient: "from-purple-950 to-pink-950",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Headline */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
            Chatin’s Intelligent Algorithms Analyze Conversational Data in Real-Time, Offering{" "}
            <span className="gradient-text-purple">Actionable Insights</span> and{" "}
            <span className="gradient-text-amber">Recommendations</span>
          </h2>
        </div>

        {/* 3 Large Stat Impact Blocks */}
        <div className="space-y-12 max-w-5xl mx-auto">
          {callouts.map((item, idx) => {
            const Icon = item.icon;
            const isEven = idx % 2 === 1;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center gap-8 ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Visual Number Card */}
                <div className={`w-full md:w-5/12 rounded-3xl p-8 bg-gradient-to-br ${item.gradient} text-white shadow-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-3.5 py-1 rounded-full text-xs font-black text-white uppercase tracking-wider ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <Icon className="w-6 h-6 text-white/70" />
                  </div>

                  <p className="text-6xl sm:text-7xl font-black tracking-tight mt-4 group-hover:scale-105 transition-transform">
                    {item.value}
                  </p>
                </div>

                {/* Text Description */}
                <div className="w-full md:w-7/12 space-y-3">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
