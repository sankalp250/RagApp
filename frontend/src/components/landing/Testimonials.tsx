"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      author: "Caleb Whitmore",
      role: "VP of Support @ Boltshift",
      avatar: "CW",
      quote: "Since implementing Chatin, our support resolution rate jumped to 87%. Our team no longer spends hours answering repetitive product queries.",
      stars: 5,
    },
    {
      author: "Azura Everly",
      role: "Lead Content Strategist @ Lumina",
      avatar: "AE",
      quote: "The self-healing Knowledge Gap intelligence is revolutionary. It told us exactly where our documentation had blind spots and drafted fixes for us.",
      stars: 5,
    },
    {
      author: "Caspian Hawthorne",
      role: "Head of Growth @ Spherule",
      avatar: "CH",
      quote: "The embeddable widget was installed in less than 2 minutes. The response latency and grounding scores are unmatched by anything we tested.",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Social Proof
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            See What Our Clients Have To Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="rounded-3xl p-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                {/* 5 Stars */}
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-indigo-200 dark:text-indigo-900 mb-3" />
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed mb-6">
                  “{rev.quote}”
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rev.author}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rev.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
