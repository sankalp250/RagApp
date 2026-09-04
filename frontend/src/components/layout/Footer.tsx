"use client";

import React from "react";
import { Bot, ArrowUpRight, Heart, Globe } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 pt-16 pb-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-100">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 font-display">
                RagApp
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
              The AI Agent Infrastructure SaaS that understands your business, connects to your tools, and automatically discovers what your AI doesn&apos;t know.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66 1.66 1.66 0 0 0-1.66-1.66"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#crawler" className="hover:text-indigo-600 transition-colors">
                  Website Crawler
                </a>
              </li>
              <li>
                <a href="#knowledge-engine" className="hover:text-indigo-600 transition-colors">
                  Hybrid RAG Engine
                </a>
              </li>
              <li>
                <a href="#agents" className="hover:text-indigo-600 transition-colors">
                  AI Agent Router
                </a>
              </li>
              <li>
                <a href="#knowledge-gaps" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  Knowledge Gaps
                  <span className="px-1.5 py-0.2 bg-rose-50 text-[10px] font-bold text-rose-600 rounded">
                    PRO
                  </span>
                </a>
              </li>
              <li>
                <a href="#widget" className="hover:text-indigo-600 transition-colors">
                  Embeddable Widget
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Integrations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Integrations
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#integrations" className="hover:text-indigo-600 transition-colors">
                  Shopify
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-indigo-600 transition-colors">
                  Slack
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-indigo-600 transition-colors">
                  Gmail & Outlook
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-indigo-600 transition-colors">
                  Zendesk & Intercom
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-indigo-600 transition-colors">
                  Custom Webhooks
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Account & Studio
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/login" className="hover:text-indigo-600 font-semibold text-slate-800 transition-colors">
                  Studio Sign In →
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-indigo-600 font-semibold text-indigo-600 transition-colors">
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Studio Dashboard
                </Link>
              </li>
              <li>
                <a href="#security" className="hover:text-indigo-600 transition-colors">
                  Data Isolation & Trust
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-indigo-600 transition-colors">
                  FAQ & Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RagApp AI, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Security
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
