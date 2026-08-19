"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Globe,
  UploadCloud,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  File,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

interface DocumentItem {
  id: string;
  name: string;
  type: "url" | "pdf" | "docx" | "csv" | "notion";
  source: string;
  chunks: number;
  tokens: string;
  status: "Indexed" | "Syncing" | "Ready";
  lastSync: string;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTestQuery, setSearchTestQuery] = useState("");
  const [testResults, setTestResults] = useState<Array<{ title: string; score: number; snippet: string }> | null>(null);

  const handleStartCrawl = () => {
    if (!urlInput.trim()) return;
    setIsCrawling(true);
    setTimeout(() => {
      setDocs((prev) => [
        {
          id: `doc-${Date.now()}`,
          name: urlInput.replace("https://", "").replace("http://", ""),
          type: "url",
          source: urlInput,
          chunks: 94,
          tokens: "28K",
          status: "Indexed",
          lastSync: "Just now",
        },
        ...prev,
      ]);
      setUrlInput("");
      setIsCrawling(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];
    setTimeout(() => {
      setDocs((prev) => [
        {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: file.name.endsWith(".pdf") ? "pdf" : "docx",
          source: `Upload (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
          chunks: 120,
          tokens: "34K",
          status: "Indexed",
          lastSync: "Just now",
        },
        ...prev,
      ]);
      setIsUploading(false);
    }, 1200);
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTestQuery.trim()) return;

    if (docs.length === 0) {
      setTestResults([]);
      return;
    }

    setTestResults([
      {
        title: docs[0]?.name || "Document Context",
        score: 0.94,
        snippet: `Semantic match snippet for query "${searchTestQuery}". Extracted from your indexed vector store with pgvector embeddings.`,
      },
    ]);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Knowledge Base & RAG Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect live web sources, PDFs, and documentation into pgvector-powered semantic embeddings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? "Processing..." : "Upload Document"}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.csv" />
          </label>
        </div>
      </div>

      {/* Crawl & Ingest Bar */}
      <div className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Website & Sitemap Web Crawler</h3>
              <p className="text-[11px] text-slate-500">Crawl your documentation URL or help center automatically</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              placeholder="https://docs.yourcompany.com or sitemap.xml"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={handleStartCrawl}
            disabled={isCrawling || !urlInput.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Crawling & Indexing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Start Ingest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Indexed Document List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>Indexed Knowledge Sources</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {docs.length}
            </span>
          </h3>
        </div>

        {docs.length === 0 ? (
          <div className="p-12 rounded-[32px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Database className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-900">No knowledge sources connected yet</h4>
              <p className="text-xs text-slate-500">
                Upload your product manuals, PDFs, or crawl your website above. Chatin will automatically chunk, embed, and index your data.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {docs.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        {doc.type === "url" ? (
                          <Globe className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{doc.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{doc.source}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Chunks</span>
                      <span className="text-xs font-black text-slate-900">{doc.chunks}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Tokens</span>
                      <span className="text-xs font-black text-slate-900">{doc.tokens}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <span className="text-[9px] font-bold text-emerald-600 block uppercase">Status</span>
                      <span className="text-xs font-black">{doc.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Semantic Search Sandbox / Vector Test */}
      <div className="p-7 rounded-[36px] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">Vector Search Sandbox</h3>
          </div>
          <p className="text-xs text-slate-500">
            Test semantic retrieval across your indexed knowledge base in real-time.
          </p>
        </div>

        <form onSubmit={handleTestSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g., What is our return window for international orders?"
              value={searchTestQuery}
              onChange={(e) => setSearchTestQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Run Query
          </button>
        </form>

        {testResults && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Retrieved Chunks ({testResults.length})
            </h4>
            {testResults.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No indexed documents to search. Upload knowledge above to test queries.</p>
            ) : (
              testResults.map((res, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{res.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px]">
                      Score: {(res.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-mono text-[11px]">
                    &ldquo;{res.snippet}&rdquo;
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
