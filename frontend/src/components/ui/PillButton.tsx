"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PillButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "dark" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

export function PillButton({
  variant = "primary",
  size = "md",
  children,
  icon,
  iconPosition = "right",
  className,
  ...props
}: PillButtonProps) {
  const sizeStyles = {
    sm: "px-4 py-2 text-xs font-semibold gap-1.5",
    md: "px-6 py-3 text-sm font-semibold gap-2",
    lg: "px-8 py-4 text-base font-semibold gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 border border-indigo-400/30",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/80 shadow-md shadow-slate-900/5 hover:border-slate-300",
    dark:
      "bg-slate-950 hover:bg-slate-900 text-white shadow-lg shadow-slate-950/20 border border-slate-800",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400",
    ghost:
      "bg-transparent hover:bg-slate-100/70 text-slate-700 hover:text-slate-900 border border-transparent",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </motion.button>
  );
}
