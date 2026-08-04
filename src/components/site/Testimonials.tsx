"use client";

import { useState } from "react";
import { Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Card, Stars, Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/db/types";

export function Testimonials({ reviews }: { reviews: (Review & { student: string })[] }) {
  const [idx, setIdx] = useState(0);
  if (!reviews.length) return null;
  const safeIdx = idx % reviews.length;
  const current = reviews[safeIdx];
  const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section id="reviews" className="relative overflow-hidden bg-paper py-20 scroll-mt-24 sm:py-24">
      <div className="absolute right-[-10%] top-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
      <div className="absolute bottom-[-10%] left-[-10%] h-72 w-72 rounded-full bg-trust-500/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">Student Stories</Eyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Real results from real students</h2>
          <p className="mt-3 text-ink-500">
            Rated <span className="font-bold text-ink-900">{avg} / 5</span> across {reviews.length} verified reviews on Google.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <Card className="relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-bl-[5rem] bg-brand-500/[0.07]" aria-hidden />
            <Quote className="size-10 text-brand-400/40" fill="currentColor" />
            <blockquote className="mt-5 text-xl leading-relaxed text-ink-800 sm:text-2xl dark:text-ink-100">
              &ldquo;{current.comment}&rdquo;
            </blockquote>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md">
                {current.student.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-semibold text-ink-900">{current.student}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars rating={current.rating} size={15} />
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-go-500/10 px-3 py-1.5 text-xs font-semibold text-go-600 ring-1 ring-go-500/20">
                <BadgeCheck className="size-3.5" /> Verified Student
              </span>
            </div>
          </Card>

          {reviews.length > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setIdx((i) => (i - 1 + reviews.length) % reviews.length)}
                className="rounded-xl border border-ink-200 bg-card p-3 text-ink-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
                aria-label="Previous review"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex gap-1.5" role="tablist" aria-label="Reviews">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === safeIdx}
                    aria-label={`Review ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className={cn("h-2 rounded-full transition-all", i === safeIdx ? "w-7 bg-brand-500" : "w-2 bg-ink-200 hover:bg-ink-300")}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => (i + 1) % reviews.length)}
                className="rounded-xl border border-ink-200 bg-card p-3 text-ink-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
                aria-label="Next review"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
