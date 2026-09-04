"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQ_LIST } from "@/lib/data";
import { ChevronDown, Sparkles, HelpCircle } from "lucide-react";
import { fadeUp } from "@/lib/animation";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SectionHeading
        badge="FREQUENTLY ASKED QUESTIONS"
        title="Everything You Need to"
        highlightText="Know About RagApp"
        description="Got questions about setup, crawling, knowledge gap intelligence, or custom integrations? We've got answers."
      />

      <div className="space-y-4">
        {FAQ_LIST.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={faq.question}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {faq.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/60">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
