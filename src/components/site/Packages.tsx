"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, Clock, CalendarDays, Gauge, Sparkles } from "lucide-react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { CoursePackage } from "@/lib/db/types";

type Filter = "all" | "popular" | "automatic" | "manual";

const FILTERS: { id: Filter; key: string }[] = [
  { id: "all", key: "packages.filterAll" },
  { id: "popular", key: "packages.filterPopular" },
  { id: "automatic", key: "packages.filterAutomatic" },
  { id: "manual", key: "packages.filterManual" },
];

export function Packages({ packages, seats }: { packages: CoursePackage[]; seats?: { vehicleType: string; free: number }[] }) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const { t } = useI18n();

  const seatsFor = (p: CoursePackage): { free: number } | undefined => seats?.find((s) => s.vehicleType === p.vehicleType) ?? seats?.find((s) => s.vehicleType === "both");

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
        <Eyebrow>{t("packages.eyebrow")}</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {t("packages.title")}
        </h2>
        <p className="mt-3 text-ink-500">
          {t("packages.subtitle")}
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
            {t(f.key)}
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
                <Sparkles className="size-3.5" /> {t("common.mostPopular")}
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">{p.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {t("packages.sessions", { n: p.sessions })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {t("packages.wks", { n: p.durationWeeks })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="size-3.5" /> {t("packages.min", { n: p.sessionMin })}
                  </span>
                </div>
              </div>
              {p.vehicleType !== "both" && <Badge tone={p.vehicleType === "automatic" ? "blue" : "ink"}>{p.vehicleType === "automatic" ? t("common.automatic") : t("common.manual")}</Badge>}
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
                {t("packages.or")} <span className="font-semibold text-brand-600 dark:text-brand-400">{formatINR(p.emi.downPayment)} {t("packages.down")}</span> + {p.emi.months} × {formatINR(p.emi.monthly)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-400">{t("packages.payFull")}</p>
            )}

            {(() => {
              const s = seatsFor(p);
              if (!s) return null;
              const pill =
                s.free <= 3 ? (
                  <Badge tone="red">{t("packages.slotsLeftUrgent", { n: s.free })}</Badge>
                ) : s.free <= 8 ? (
                  <Badge tone="amber">{t("packages.slotsLeft", { n: s.free })}</Badge>
                ) : (
                  <Badge tone="green">{t("packages.freeSlots", { n: s.free })}</Badge>
                );
              return (
                <div className="mt-3 flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-go-500 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-go-500" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t("common.live")}</span>
                  {pill}
                </div>
              );
            })()}

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
                {t("common.viewDetails")} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/courses" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          {t("packages.seeAll", { n: packages.length })}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
