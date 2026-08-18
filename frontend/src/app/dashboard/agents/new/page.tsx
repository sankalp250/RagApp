"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { api } from "@/lib/api";

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful and accurate AI Assistant. Answer questions strictly using the provided verified knowledge documents."
  );
  const [primaryModel, setPrimaryModel] = useState("gemini-2.5-flash");
  const [fallbackModel, setFallbackModel] = useState("groq/qwen-qwq-32b");
  const [temperature, setTemperature] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const created = await api.createAgent({
        name,
        description,
        system_prompt: systemPrompt,
        primary_model: primaryModel,
        fallback_model: fallbackModel,
        temperature,
        max_tokens: 1024,
        top_k_chunks: 5,
        similarity_threshold: 0.65,
        is_active: true,
      });
      router.push(`/dashboard/agents/${created.id || "agent-1"}/customize`);
    } catch {
      // Demo navigation
      router.push("/dashboard/agents");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
        <Link href="/dashboard/agents">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-white">Create New AI Agent</h1>
          <p className="text-xs text-slate-400">Configure your agent&apos;s identity, LLM provider, and system persona.</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleCreate} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <Input
          label="Agent Name"
          placeholder="e.g. VIP Customer Concierge"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Description"
          placeholder="e.g. Handles enterprise billing and SLA inquiries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Primary Model
            </label>
            <select
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Primary)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Fallback Provider
            </label>
            <select
              value={fallbackModel}
              onChange={(e) => setFallbackModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="groq/qwen-qwq-32b">Groq Qwen 32B (Ultra-fast failover)</option>
              <option value="groq/llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
            </select>
          </div>
        </div>

        <Textarea
          label="System Prompt Persona"
          rows={4}
          required
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Sampling Temperature: {temperature}</span>
            <span className="text-indigo-400">Deterministic &amp; Fact-Grounded</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full justify-center mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Agent &amp; Customize
        </Button>
      </form>

    </div>
  );
}
