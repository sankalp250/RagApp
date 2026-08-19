"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dark" | "gradient" | "elevated";
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  hoverEffect = true,
  ...props
}: GlassCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "dark":
        return "bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white shadow-2xl";
      case "gradient":
        return "bg-gradient-to-br from-white/90 via-white/70 to-indigo-50/40 backdrop-blur-xl border-white/80 shadow-lg shadow-indigo-500/5";
      case "elevated":
        return "bg-white/90 backdrop-blur-2xl border-slate-200/80 shadow-xl shadow-slate-900/5";
      case "default":
      default:
        return "bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-900/[0.03]";
    }
  };

  return (
    <motion.div
      className={cn(
        "rounded-[28px] border transition-all duration-300 relative overflow-hidden",
        getVariantStyles(),
        hoverEffect && "hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200/60",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
