"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, DocumentItem } from "@/lib/api";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: "doc-1",
      agent_id: "agent-1",
      organization_id: "org-1",
      filename: "company_return_and_refund_policy_2026.pdf",
      file_type: "application/pdf",
      status: "ready",
      chunk_count: 42,
      file_size_bytes: 524288,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "doc-2",
      agent_id: "agent-1",
      organization_id: "org-1",
      filename: "product_shipping_and_delivery_terms.docx",
      file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      status: "ready",
      chunk_count: 28,
      file_size_bytes: 314572,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "doc-3",
      agent_id: "agent-1",
      organization_id: "org-1",
      filename: "frequently_asked_questions_master.csv",
      file_type: "text/csv",
      status: "ready",
      chunk_count: 114,
      file_size_bytes: 840000,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        agent_id: "agent-1",
        organization_id: "org-1",
        filename: file.name,
        file_type: file.type || "application/octet-stream",
        status: "processing",
        chunk_count: 0,
        file_size_bytes: file.size,
        created_at: new Date().toISOString(),
      };
      setDocuments((prev) => [newDoc, ...prev]);

      // Simulate async ingestion worker pipeline
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === newDoc.id
              ? { ...d, status: "ready", chunk_count: Math.floor(file.size / 8000) + 5 }
              : d
          )
        );
        setIsUploading(false);
      }, 2000);
    } catch {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Knowledge Base</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload and manage the documents that power your autonomous AI chatbots.
          </p>
        </div>
      </div>

      {/* Drag & Drop Upload Canvas */}
      <div className="rounded-3xl p-8 bg-slate-900 border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors flex flex-col items-center justify-center text-center relative group">
        <input
          type="file"
          accept=".pdf,.docx,.txt,.csv,.json"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-indigo-950">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {isUploading ? "Chunking & Vectorizing Document..." : "Click to upload or drag & drop"}
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Supported formats: PDF, DOCX, TXT, CSV, JSON. Files are automatically chunked into 500-token semantic chunks with pgvector embeddings.
        </p>
      </div>

      {/* Documents Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Ingested Documents ({filteredDocs.length})</h3>
          </div>

          <div className="w-64">
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{doc.filename}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB &bull; {doc.chunk_count} vector chunks &bull; Ingested {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={doc.status === "ready" ? "success" : doc.status === "processing" ? "warning" : "destructive"}>
                  {doc.status}
                </Badge>

                <button
                  onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
