"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShieldCheck, Lock, Server, Cpu, Database, KeyRound, CheckCircle2 } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animation";

const SECURITY_CARDS = [
  {
    title: "Multi-Tenant Data Isolation",
    desc: "Dedicated organization namespaces in PostgreSQL & vector clusters ensure your documents never bleed across tenants.",
    icon: Lock,
    tag: "Strict Isolation",
  },
  {
    title: "Zero Model Training",
    desc: "Your proprietary documents and customer chats are strictly used for RAG grounding and are never retained for training public foundation models.",
    icon: ShieldCheck,
    tag: "Privacy First",
  },
  {
    title: "High-Throughput Vector Search",
    desc: "Sub-20ms cosine similarity searches powered by optimized Qdrant & pgvector distributed indices.",
    icon: Database,
    tag: "Sub-20ms",
  },
  {
    title: "Granular RBAC & Audit Trails",
    desc: "Role-based access control with detailed audit logs for every crawled URL, indexed chunk, and tool execution.",
    icon: KeyRound,
    tag: "Enterprise Ready",
  },
];

export function SecurityScale() {
  return (
    <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="ENTERPRISE SECURITY & INFRASTRUCTURE"
        title="Engineered for Strict Security and"
        highlightText="Mission-Critical Scale"
        description="From high-concurrency retail flash sales to strict HIPAA/GDPR data governance, Chatin provides production-hardened reliability."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {SECURITY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {card.tag}
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 mb-2">{card.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SOC-2 & GDPR Compliant</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
