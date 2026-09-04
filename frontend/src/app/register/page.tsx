"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, ArrowRight, Lock, Mail, Building, User, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const { user, register } = useAuth();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace(redirectTarget);
    }
  }, [user, router, redirectTarget]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, name, company);
      router.replace(redirectTarget);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already exists")) {
        setError("An account with this email already exists. You only need to sign up once! Click 'Sign In' below.");
      } else {
        setError(msg || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Pastel Glows */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] ambient-glow-purple -z-10 blur-3xl pointer-events-none opacity-60" />
      <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] ambient-glow-pink -z-10 blur-3xl pointer-events-none opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md p-8 rounded-[36px] bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-2xl shadow-indigo-500/10 space-y-5"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900 font-display">
              RagApp
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Sign Up (One-Time Setup)</h2>
          <p className="text-xs text-slate-500">Create your account once · Access forever with quick login</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="space-y-1">
              <p>{error}</p>
              {error.includes("already exists") && (
                <Link href="/login" className="inline-block font-bold text-indigo-600 underline">
                  Go to Sign In →
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Real Google Identity Services (GSI) OAuth */}
        <GoogleSignInButton text="signup_with" onError={(err) => setError(err)} />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or sign up with email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Full Name</label>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <User className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Company / Brand Name</label>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <Building className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Acme Store"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Work Email</label>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 pt-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete One-Time Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already signed up before?{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            Sign In Directly
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbfcfe] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
