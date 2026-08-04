"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Clock, CalendarDays, CreditCard, Users, CarFront, ArrowRight } from "lucide-react";
import { Badge, buttonClasses, Spinner } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { api, type ApiData } from "@/lib/client";
import { formatINR } from "@/lib/utils";
import type { CoursePackage } from "@/lib/db/types";

export default function CoursesPage() {
  const [data, setData] = React.useState<{ packages: CoursePackage[]; settings: ApiData } | null>(null);

  React.useEffect(() => {
    api<{ packages: CoursePackage[]; settings: ApiData }>("/api/public/packages").then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Courses & Pricing"
        title={<>Pick your perfect course</>}
        subtitle="Every package includes a certified instructor, dual-control car, attendance tracking and a certificate on completion. EMI available on most courses."
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <div className="space-y-8">
          {data.packages.map((p) => (
            <div key={p.id} id={p.slug} className="card-shadow scroll-mt-24 rounded-3xl border border-ink-100 bg-card p-6 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">{p.name}</h2>
                    {p.popular && <Badge tone="brand">Most Popular</Badge>}
                    {p.vehicleType !== "both" && <Badge tone={p.vehicleType === "automatic" ? "blue" : "ink"}>{p.vehicleType === "automatic" ? "Automatic" : "Manual"}</Badge>}
                  </div>
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-500">{p.description}</p>

                  <div className="mt-5 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoChip icon={<Clock className="size-4" />} label="Duration" value={`${p.durationWeeks} weeks`} />
                    <InfoChip icon={<CalendarDays className="size-4" />} label="Sessions" value={`${p.sessions} lessons`} />
                    <InfoChip icon={<CarFront className="size-4" />} label="Vehicle" value={p.vehicleType === "both" ? "Any" : p.vehicleType} />
                    <InfoChip icon={<Users className="size-4" />} label="Ratio" value="1:1 training" />
                  </div>

                  <div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">What&apos;s included</p>
                      <ul className="mt-2 space-y-2">
                        {p.includes.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                            <Check className="mt-0.5 size-4 shrink-0 text-go-600" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Course features</p>
                      <ul className="mt-2 space-y-2">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                            <Check className="mt-0.5 size-4 shrink-0 text-brand-500" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col rounded-2xl border border-ink-100 bg-paper p-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">{formatINR(p.price)}</span>
                    {p.originalPrice && <span className="text-lg text-ink-400 line-through">{formatINR(p.originalPrice)}</span>}
                  </div>
                  {p.emi ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                      <CreditCard className="size-4 text-brand-500" />
                      EMI: <span className="font-semibold text-ink-800">{formatINR(p.emi.downPayment)} down</span> + {p.emi.months} × {formatINR(p.emi.monthly)}
                    </p>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                      <CreditCard className="size-4 text-brand-500" /> Pay in full at booking
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">All-inclusive · GST invoice provided</p>

                  <div className="mt-4 space-y-1.5 text-xs text-ink-500">
                    <p>✓ Free demo lesson</p>
                    <p>✓ Free reschedule (24h notice)</p>
                    <p>✓ Refund up to 90%</p>
                    <p>✓ Certificate with QR verification</p>
                  </div>

                  <div className="mt-auto space-y-2 pt-5">
                    <Link href={`/book?pkg=${p.slug}`} className={buttonClasses(p.popular ? "primary" : "dark", "lg", "w-full")}>
                      Book This Course <ArrowRight className="size-4" />
                    </Link>
                    <a
                      href={`https://wa.me/919000090000?text=${encodeURIComponent(`Hi! I'm interested in the ${p.name} (${formatINR(p.price)}). Please share details.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses("outline", "lg", "w-full")}
                    >
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FinalCTA />
    </>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3 dark:bg-ink-100/10">
      <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">{icon}</div>
      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{value}</p>
    </div>
  );
}
