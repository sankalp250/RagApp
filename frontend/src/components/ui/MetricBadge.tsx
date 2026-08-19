"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricBadgeProps {
  children: React.ReactNode;
  color?: "orange" | "pink" | "purple" | "emerald" | "blue" | "indigo";
  rotate?: number;
  className?: string;
}

export function MetricBadge({
  children,
  color = "orange",
  rotate = -4,
  className,
}: MetricBadgeProps) {
  const colorStyles = {
    orange: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30",
    pink: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30",
    purple: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30",
    blue: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30",
    indigo: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-indigo-500/30",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08, rotate: 0 }}
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-md transition-transform duration-200 cursor-default select-none",
        colorStyles[color],
        className
      )}
    >
      {children}
    </motion.span>
  );
}
