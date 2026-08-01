"use client";

import { useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Stars } from "@/components/ui";
import type { Review } from "@/lib/db/types";

export function Testimonials({ reviews }: { reviews: (Review & { student: string })[] }) {
  const [idx, setIdx] = useState(0);
  if (!reviews.length) return null;
  const safeIdx = idx % reviews.length;
  const current = reviews[safeIdx];

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Student Stories</span>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Real results from real students</h2>
        </div>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <Card className="p-8 sm:p-10">
            <Quote className="size-8 text-brand-400/40" fill="currentColor" />
            <p className="mt-4 text-lg leading-relaxed text-ink-800 dark:text-ink-200">{current.comment}</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600 font-bold text-white">
                {current.student.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-semibold text-ink-900">{current.student}</p>
                <div className="mt-0.5">
                  <Stars rating={current.rating} />
                </div>
              </div>
              <span className="ml-auto rounded-full bg-go-500/10 px-3 py-1 text-xs font-semibold text-go-600">
                Verified Student
              </span>
            </div>
          </Card>

          {reviews.length > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setIdx((i) => (i - 1 + reviews.length) % reviews.length)}
                className="rounded-xl border border-ink-200 bg-card p-2.5 text-ink-600 hover:bg-ink-50"
                aria-label="Previous review"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex gap-1.5">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === safeIdx ? "w-6 bg-brand-500" : "w-2 bg-ink-200"}`}
                    aria-label={`Review ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => (i + 1) % reviews.length)}
                className="rounded-xl border border-ink-200 bg-card p-2.5 text-ink-600 hover:bg-ink-50"
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
