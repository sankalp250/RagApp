"use client";

import React from "react";
import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Footer() {
  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden pt-20 pb-12">
      {/* Glow Orbs */}
      <div className="orb-purple w-[500px] h-[500px] -top-20 left-1/2 -translate-x-1/2 opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Pre-Footer Big CTA Banner */}
        <div className="relative rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl mb-20 overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Reach More People and Grow Your Brand with Autonomous AI
            </h3>
            <p className="mt-3 text-white/90 text-sm sm:text-base font-medium">
              Start your 14-day free trial today. No credit card required.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 shadow-xl shadow-slate-950/20 font-bold" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Main Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">Chatin AI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade RAG architecture with pgvector, real-time telemetry, and self-healing knowledge gap intelligence.
            </p>
            <div className="flex items-center gap-4 text-slate-400 pt-2">
              <Link href="#" aria-label="X" className="hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </Link>
              <Link href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              </Link>
              <Link href="#" aria-label="GitHub" className="hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
              </Link>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link href="#features" className="hover:text-white transition-colors">AI Agents</Link></li>
              <li><Link href="#analytics" className="hover:text-white transition-colors">Knowledge Base</Link></li>
              <li><Link href="#analytics" className="hover:text-white transition-colors">Gap Intelligence</Link></li>
              <li><Link href="#integrations" className="hover:text-white transition-colors">Embeddable Widget</Link></li>
            </ul>
          </div>

          {/* Col 3: Integrations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Integrations</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link href="#integrations" className="hover:text-white transition-colors">Slack &amp; Discord</Link></li>
              <li><Link href="#integrations" className="hover:text-white transition-colors">Zendesk &amp; Intercom</Link></li>
              <li><Link href="#integrations" className="hover:text-white transition-colors">Shopify &amp; Webflow</Link></li>
              <li><Link href="#integrations" className="hover:text-white transition-colors">REST API &amp; Webhooks</Link></li>
            </ul>
          </div>

          {/* Col 4: Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security &amp; Privacy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Status Page</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Chatin Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Cookie Settings</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
