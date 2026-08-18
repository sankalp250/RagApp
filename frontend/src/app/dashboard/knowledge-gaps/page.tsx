"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  FilePlus,
  ArrowRight,
  TrendingDown,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

export default function KnowledgeGapsPage() {
  const [selectedGap, setSelectedGap] = useState({
    id: "gap-1",
    topic: "Delivery address changes",
    status: "Needs Attention",
    totalConversations: 143,
    successfulAnswers: "32%",
    avgRelevanceScore: 0.41,
    userDissatisfaction: "38%",
    commonQuestions: [
      "Can I change my delivery address after shipment?",
      "I entered the wrong address, can I update it?",
      "Is it possible to redirect my package?",
      "My order is already shipped, what can I do?",
      "Can the courier deliver to a different address?",
    ],
    suggestedTopics: [
      "Changing address before shipment cutoff",
      "Options available once package is in transit",
      "Direct carrier redirection policies (FedEx/UPS/DHL)",
      "Time limits and customer service escalation",
    ],
  });

  const [activeSubTab, setActiveSubTab] = useState("insights");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateRecommendation = async () => {
    setIsGenerating(true);
    setIsModalOpen(true);

    try {
      const res = await api.generateGapRecommendation(selectedGap.id);
      setGeneratedDraft(
        res.recommendation ||
          `# Knowledge Article: How to Update Your Delivery Address\n\n## 1. Before Order Dispatch\nCustomers can modify their delivery address directly from their Account Dashboard within 24 hours of placing an order.\n\n## 2. In-Transit Package Redirection\nOnce a tracking number is generated, packages cannot be redirected by our support team directly. Customers must use the carrier's delivery management portal (e.g., UPS My Choice or FedEx Delivery Manager) to request a hold for pickup or alternate address.`
      );
    } catch {
      setGeneratedDraft(
        `# Knowledge Base Article: Delivery Address Modification Policy\n\n## Overview\nThis article clarifies the cutoff times and procedures for modifying shipping addresses.\n\n### Rules\n1. **Unfulfilled Orders:** Immediate change permitted via order details.\n2. **Shipped Orders:** Must use carrier self-service portal to update destination.\n3. **Carrier Restrictions:** International shipments cannot be rerouted once customs processing begins.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white">Knowledge Gap Intelligence</h1>
            <Badge variant="warning">{selectedGap.status}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Topic: <span className="text-slate-200 font-bold">{selectedGap.topic}</span> &bull; Customers are asking questions where your knowledge base lacks clarity.
          </p>
        </div>

        <Button variant="outline" size="sm">
          Mark as Resolved
        </Button>
      </div>

      {/* 4 Gap Metric Indicators (Matching Image 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Total Conversations</p>
          <p className="text-2xl font-black text-white">{selectedGap.totalConversations}</p>
          <p className="text-[10px] text-slate-500">affected sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Successful Answers</p>
          <p className="text-2xl font-black text-rose-400">{selectedGap.successfulAnswers}</p>
          <p className="text-[10px] text-slate-500">below 60% threshold</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Avg. Relevance Score</p>
          <p className="text-2xl font-black text-amber-400">{selectedGap.avgRelevanceScore}</p>
          <p className="text-[10px] text-slate-500">grounding retrieval</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">User Dissatisfaction</p>
          <p className="text-2xl font-black text-rose-400">{selectedGap.userDissatisfaction}</p>
          <p className="text-[10px] text-slate-500">negative thumbs feedback</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "insights", label: "Insights & Clustering" },
          { id: "recommendations", label: "AI Recommendations" },
          { id: "conversations", label: "Affected Conversations" },
        ]}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      {/* 2-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Common Questions Cluster (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Common User Questions Cluster
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              5 Variations
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedGap.commonQuestions.map((q, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-200 font-medium flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>{q}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Semantic density suggests these queries failed due to missing explicit carrier rerouting policies.
          </p>
        </div>

        {/* Right Column: Suggested Content & AI Recommendation (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Suggested Knowledge Resolution
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-200">
              Auto-Generated
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Add a concise help article or FAQ chunk covering the following specific points:
          </p>

          <ul className="space-y-2 text-xs text-slate-300">
            {selectedGap.suggestedTopics.map((topic, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-indigo-900/60 flex items-center gap-3">
            <Button
              onClick={handleGenerateRecommendation}
              variant="gradient"
              size="md"
              className="w-full justify-center"
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
            >
              Generate AI Article Draft
            </Button>
          </div>
        </div>

      </div>

      {/* AI Draft Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="AI-Generated Knowledge Article Draft"
        description="Review and add this draft directly to your agent's knowledge base."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generatedDraft}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                alert("Article draft added to Knowledge Base and scheduled for ingestion!");
                setIsModalOpen(false);
              }}
              leftIcon={<FilePlus className="w-4 h-4" />}
            >
              Save to Knowledge Base
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
