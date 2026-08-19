"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { INTEGRATIONS_LIST } from "@/lib/data";
import { fadeUp, staggerContainer } from "@/lib/animation";
import {
  ShoppingBag,
  MessageSquare,
  Mail,
  Headphones,
  FileText,
  Radio,
  CreditCard,
  Webhook,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

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

export function Integrations() {
  return (
    <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SectionHeading
        badge="POWERFUL ECOSYSTEM"
        title="Connect Seamlessly to Your"
        highlightText="Favorite Business Tools"
        description="Empower your agent with deep integrations across e-commerce, customer support inboxes, communication channels, and internal documentation."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {INTEGRATIONS_LIST.map((item) => {
          const Icon = ICON_MAP[item.icon] || Webhook;
          return (
            <motion.div
              key={item.id}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === "Connected"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.status === "Popular"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 mb-1">{item.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>{item.actionType}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
