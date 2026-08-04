"use client";

import { Eyebrow } from "@/components/ui";

export function PageHero({ eyebrow, title, subtitle, tone = "brand" }: { eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode; tone?: "brand" | "trust" }) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-card">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="absolute -top-28 right-[-6%] h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
      <div className="absolute bottom-[-8rem] left-[-6%] h-72 w-72 rounded-full bg-trust-500/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pb-14 lg:pt-36">
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <h1 className="font-display mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">{subtitle}</p>}
      </div>
    </section>
  );
}
