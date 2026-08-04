"use client";

import Link from "next/link";
import { CarFront, Gauge, Zap, Settings2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/db/types";

const statusStyles: Record<string, { label: string; cls: string }> = {
  available: { label: "Available now", cls: "text-go-600 bg-go-500/10 ring-go-500/20 dark:text-go-500" },
  booked: { label: "Booked", cls: "text-trust-700 bg-trust-500/10 ring-trust-500/20 dark:text-trust-400" },
  maintenance: { label: "In service", cls: "text-warn-500 bg-warn-500/10 ring-warn-500/20" },
  cleaning: { label: "Being cleaned", cls: "text-ink-500 bg-ink-100 ring-ink-200 dark:text-ink-300" },
};

function isEV(v: Vehicle) {
  return /EV|Comet/i.test(`${v.model} ${v.name}`);
}

function fuelTone(level: number) {
  if (level >= 60) return "bg-go-500";
  if (level >= 30) return "bg-amber-500";
  return "bg-stop-500";
}

export function Fleet({ vehicles }: { vehicles: Vehicle[] }) {
  const fleet = vehicles.slice(0, 6);
  const manual = fleet.filter((v) => v.type === "manual").length;
  const automatic = fleet.filter((v) => v.type === "automatic").length;
  const ev = fleet.filter(isEV).length;

  return (
    <section id="fleet" className="border-y border-ink-100 bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Eyebrow>Our Fleet</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Modern cars, maintained to perfection
            </h2>
            <p className="mt-3 text-ink-500">
              Every vehicle is dual-control equipped, insured and serviced on a strict schedule — so you learn on the safest, newest cars in the city.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="ink">{fleet.length} vehicles</Badge>
            <Badge tone="blue">{automatic} automatic</Badge>
            <Badge tone="amber">{manual} manual</Badge>
            {ev > 0 && <Badge tone="green">{ev} electric</Badge>}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fleet.map((v) => (
            <div
              key={v.id}
              className="group card-shadow relative flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-ink-800 via-ink-900 to-night-950">
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_90%,rgba(16,185,129,0.5)_0,transparent_50%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.6)_0,transparent_45%)]" />
                <div className="absolute inset-0 bg-grid-dark" />
                <div className="relative flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <CarFront className="size-10 text-brand-400" />
                </div>
                <span
                  className={cn(
                    "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                    statusStyles[v.status]?.cls ?? "text-ink-500 bg-ink-100 ring-ink-200"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {statusStyles[v.status]?.label ?? v.status}
                </span>
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {v.type === "automatic" ? (
                    <Badge tone="blue">
                      <Settings2 className="size-3" /> Automatic
                    </Badge>
                  ) : (
                    <Badge tone="ink">Manual</Badge>
                  )}
                  {isEV(v) && (
                    <Badge tone="green">
                      <Zap className="size-3" /> EV
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-ink-900">{v.name}</h3>
                  <span className="text-xs font-medium text-ink-400">{v.regNumber}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">{v.model}</p>

                <div className="mt-4 space-y-2 text-xs text-ink-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="size-3.5 text-brand-500" /> Fuel level
                    </span>
                    <span className="font-semibold text-ink-700">{v.fuelLevel}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div className={cn("h-full rounded-full transition-all", fuelTone(v.fuelLevel))} style={{ width: `${v.fuelLevel}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5">
                      <CarFront className="size-3.5 text-brand-500" /> Odometer
                    </span>
                    <span className="font-semibold text-ink-700">{v.odometer.toLocaleString("en-IN")} km</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-go-600">
                  <CheckCircle2 className="size-3.5" /> Insured · Dual-control · Serviced
                </div>

                <div className="mt-auto pt-5">
                  <Link href="/book" className={buttonClasses("outline", "md", "w-full group-hover:border-brand-400")}>
                    Reserve this car <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-400">
          Prefer a specific car? Tell us at booking — we&apos;ll assign it to your slots when available.
        </p>
      </div>
    </section>
  );
}
