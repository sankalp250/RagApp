"use client";

import React from "react";
import { MessageSquare, Users, Award, Globe2 } from "lucide-react";
import { motion } from "framer-motion";

export function StatsBar() {
  const stats = [
    { label: "Active Chatbots", value: "10K+", icon: MessageSquare, desc: "Deployed across enterprises" },
    { label: "Conversations Handled", value: "2M+", icon: Users, desc: "Monthly multi-turn chats" },
    { label: "Customer Satisfaction", value: "98%", icon: Award, desc: "Positive user ratings" },
    { label: "Languages Supported", value: "50+", icon: Globe2, desc: "Multilingual vector search" },
  ];

  const companies = ["Acme Corp", "Boltshift", "Spherule", "Lumina", "Penta", "Nexus"];

  return (
    <section className="py-12 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4 Big Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  {s.value}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {s.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {s.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trusted By Logos */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Trusted by Innovative Teams Worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {companies.map((name, i) => (
              <span key={i} className="text-sm sm:text-base font-extrabold tracking-wider text-slate-800 dark:text-slate-200">
                &bull; {name}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
