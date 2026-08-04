"use client";

import * as React from "react";
import { Award, CalendarCheck2, Car, HeartHandshake, MapPin, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { Spinner, Stars, Eyebrow } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { api, type ApiData } from "@/lib/client";

export default function AboutPage() {
  const [data, setData] = React.useState<ApiData>(null);

  React.useEffect(() => {
    api("/api/public/site").then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const stats = data.stats;
  const topReviews = data.reviews.slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="About Sri Mathru"
        title={
          <>
            Bengaluru&apos;s modern driving school, run with{" "}
            <span className="text-gradient">heart</span>.
          </>
        }
        subtitle="We started Sri Mathru Driving School with one belief: learning to drive should feel safe, simple and even fun. Today we run a fully automated school — live slot booking, progress tracking and certificates issued the moment you finish, all without paperwork."
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, value: `${stats.students}+`, label: "Students trained" },
            { icon: Car, value: `${stats.instructors}`, label: "Certified instructors" },
            { icon: CalendarCheck2, value: `${stats.lessonsCompleted}+`, label: "Lessons completed" },
            { icon: Award, value: stats.rating.toFixed(1), label: "Average rating" },
          ].map((s) => (
            <div key={s.label} className="card-shadow rounded-3xl border border-ink-100 bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <s.icon className="size-5" />
              </div>
              <p className="font-display mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{s.value}</p>
              <p className="mt-1 text-sm text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Why students pick us</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900">Automation that respects your time</h2>
            <div className="mt-7 space-y-5">
              {[
                { icon: Zap, title: "Book in 2 minutes", body: "Pick your course, see live availability, pay online. No phone tag." },
                { icon: ShieldCheck, title: "Verified instructors only", body: "Police-verified, RTO-certified and continuously trained — with real student ratings." },
                { icon: Sparkles, title: "Progress you can see", body: "Every lesson logs your skill scores. Watch yourself get better, chart included." },
                { icon: HeartHandshake, title: "Female-friendly batches", body: "Dedicated female instructors and flexible batches, so everyone feels at home." },
              ].map((f) => (
                <div key={f.title} className="group flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:text-brand-400">
                    <f.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink-900">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-night-900 p-8">
            <div className="bg-grid-dark absolute inset-0" aria-hidden />
            <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
            <div className="relative">
              <h3 className="font-display text-2xl font-bold text-white">What students say</h3>
              <div className="mt-6 space-y-4">
                {topReviews.map((r: ApiData) => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <Stars rating={r.rating} size={15} />
                    <p className="mt-3 text-sm leading-relaxed text-white/80">&quot;{r.comment}&quot;</p>
                    <p className="mt-3 text-xs font-semibold text-brand-300">— {r.student}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-shadow mt-16 rounded-3xl border border-ink-100 bg-card p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-ink-900">Our branches</h2>
            <span className="text-sm text-ink-400">Open 6 AM – 8 PM, Mon–Sat</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.settings.branches?.map((b: ApiData) => (
              <div key={b.id} className="rounded-2xl border border-ink-100 bg-paper p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <MapPin className="size-4.5" />
                </div>
                <h3 className="font-display mt-3 font-bold text-ink-900">{b.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{b.address}</p>
                <p className="mt-2 text-sm font-semibold text-go-600">{b.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FinalCTA />
    </>
  );
}
