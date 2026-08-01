"use client";

import Link from "next/link";
import { Check, ArrowRight, Clock, CalendarDays } from "lucide-react";
import { Badge, buttonClasses } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import type { CoursePackage } from "@/lib/db/types";

export function Packages({ packages }: { packages: CoursePackage[] }) {
  const featured = [...packages].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Our Courses</span>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Transparent packages. No hidden fees.</h2>
        <p className="mt-3 text-ink-500">Every package includes a certified instructor, dual-control car and progress tracking. EMI available on most courses.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <div
            key={p.id}
            className={`card-shadow relative flex flex-col rounded-3xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${
              p.popular ? "border-brand-400/60 ring-1 ring-brand-400/30" : "border-ink-100"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                Most Popular
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">{p.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {p.sessions} sessions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {p.durationWeeks} wks
                  </span>
                  {p.vehicleType !== "both" && <Badge tone="blue">{p.vehicleType === "automatic" ? "Automatic" : "Manual"}</Badge>}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-500">{p.description}</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-ink-900">{formatINR(p.price)}</span>
              {p.originalPrice && <span className="text-sm text-ink-400 line-through">{formatINR(p.originalPrice)}</span>}
            </div>
            {p.emi && (
              <p className="mt-1 text-xs text-ink-400">
                or <span className="font-semibold text-brand-600 dark:text-brand-400">{formatINR(p.emi.downPayment)} down</span> + {p.emi.months} × {formatINR(p.emi.monthly)}
              </p>
            )}

            <ul className="mt-5 space-y-2.5">
              {p.includes.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-go-600" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <Link href={`/courses#${p.slug}`} className={buttonClasses(p.popular ? "primary" : "outline", "md", "w-full")}>
                View Details <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          See all {packages.length} courses <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
