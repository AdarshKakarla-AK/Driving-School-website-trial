"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, Clock, CalendarDays, Gauge, Sparkles } from "lucide-react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CoursePackage } from "@/lib/db/types";

type Filter = "all" | "popular" | "automatic" | "manual";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All courses" },
  { id: "popular", label: "Most popular" },
  { id: "automatic", label: "Automatic" },
  { id: "manual", label: "Manual" },
];

export function Packages({ packages }: { packages: CoursePackage[] }) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const matches = (p: CoursePackage) => {
    if (filter === "popular") return p.popular;
    if (filter === "automatic") return p.vehicleType === "automatic" || p.vehicleType === "both";
    if (filter === "manual") return p.vehicleType === "manual" || p.vehicleType === "both";
    return true;
  };

  const visible = packages.filter(matches);
  const featured = [...visible].sort((a, b) => Number(b.popular ?? false) - Number(a.popular ?? false)).slice(0, 6);

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Courses & Pricing</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Transparent packages. No hidden fees.
        </h2>
        <p className="mt-3 text-ink-500">
          Every package includes a certified instructor, a dual-control car and real-time progress tracking. EMI available on most courses.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              filter === f.id
                ? "border-brand-500 bg-brand-500 text-white shadow-[0_8px_20px_-10px_rgba(245,158,11,0.6)]"
                : "border-ink-200 bg-card text-ink-600 hover:border-brand-300 hover:text-ink-900 dark:text-ink-300"
            )}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <div
            key={p.id}
            className={cn(
              "card-shadow group relative flex flex-col rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg",
              p.popular ? "gradient-border border-transparent" : "border-ink-100"
            )}
          >
            {p.popular && (
              <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                <Sparkles className="size-3.5" /> Most Popular
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">{p.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {p.sessions} sessions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {p.durationWeeks} wks
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="size-3.5" /> {p.sessionMin} min
                  </span>
                </div>
              </div>
              {p.vehicleType !== "both" && <Badge tone={p.vehicleType === "automatic" ? "blue" : "ink"}>{p.vehicleType === "automatic" ? "Automatic" : "Manual"}</Badge>}
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-500">{p.description}</p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className={cn("font-display text-3xl font-extrabold tracking-tight", p.popular ? "text-brand-600 dark:text-brand-400" : "text-ink-900")}>
                {formatINR(p.price)}
              </span>
              {p.originalPrice && <span className="text-sm text-ink-400 line-through">{formatINR(p.originalPrice)}</span>}
            </div>
            {p.emi ? (
              <p className="mt-1 text-xs text-ink-400">
                or <span className="font-semibold text-brand-600 dark:text-brand-400">{formatINR(p.emi.downPayment)} down</span> + {p.emi.months} × {formatINR(p.emi.monthly)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-400">Pay in full or at booking</p>
            )}

            <div className="mt-5 space-y-2.5 border-t border-ink-100 pt-5">
              {p.includes.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", p.popular ? "bg-brand-500/15 text-brand-600 dark:text-brand-400" : "bg-go-500/15 text-go-600")}>
                    <Check className="size-3" />
                  </span>
                  {f}
                </li>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <Link href={`/courses#${p.slug}`} className={buttonClasses(p.popular ? "primary" : "outline", "md", "w-full")}>
                View Details <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/courses" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          See all {packages.length} courses
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
