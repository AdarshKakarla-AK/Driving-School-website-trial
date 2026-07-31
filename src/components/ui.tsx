"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "success" | "white";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-sm hover:from-brand-300 hover:to-brand-500 focus-visible:ring-brand-400",
  dark: "bg-ink-900 text-white hover:bg-ink-800 focus-visible:ring-ink-700",
  outline: "border border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50 focus-visible:ring-ink-300",
  ghost: "text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-300",
  danger: "bg-stop-500 text-white hover:bg-stop-500/90 focus-visible:ring-stop-500/50",
  success: "bg-go-600 text-white hover:bg-go-500 focus-visible:ring-go-500/50",
  white: "bg-white text-ink-900 shadow-sm hover:bg-ink-50 focus-visible:ring-white/60",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClasses(variant, size, className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Badge({ children, className, tone = "brand" }: { children: React.ReactNode; className?: string; tone?: "brand" | "green" | "red" | "ink" | "blue" | "amber" }) {
  const tones = {
    brand: "bg-brand-100 text-brand-800",
    green: "bg-go-500/10 text-go-600",
    red: "bg-stop-500/10 text-stop-500",
    ink: "bg-ink-100 text-ink-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-500/10 text-amber-700",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl bg-card card-shadow border border-ink-100", className)} {...props}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-ink-900 truncate">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
        </div>
        {icon && <div className="shrink-0 rounded-xl bg-brand-50 p-2 text-brand-600">{icon}</div>}
      </div>
    </Card>
  );
}

export function Input({ className, label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400",
          "focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50",
          className
        )}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function Select({ className, label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <select
        className={cn(
          "h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ className, label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <textarea
        className={cn(
          "w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i - 0.25;
        const half = !filled && rating >= i - 0.75;
        return (
          <span key={i} className="relative inline-flex">
            <Star size={size} className="text-ink-200" fill="currentColor" />
            {(filled || half) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: half ? "50%" : "100%" }}>
                <Star size={size} className="text-brand-500" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-brand-500", className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={cn("w-full rounded-2xl bg-white p-6 shadow-2xl", wide ? "max-w-2xl" : "max-w-md")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Avatar({ name, color, size = "md" }: { name: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-white", sizes[size])}
      style={{ background: color ?? "linear-gradient(135deg,#f59e0b,#d97706)" }}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-100", className)}>
      <div className={cn("h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all", barClassName)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <p className="font-medium text-ink-700">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-ink-400">{subtitle}</p>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: React.ReactNode }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            active === t.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
