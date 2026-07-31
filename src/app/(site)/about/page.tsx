"use client";

import * as React from "react";
import Link from "next/link";
import { Award, CalendarCheck2, Car, HeartHandshake, MapPin, MessageSquareText, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { buttonClasses, Spinner, Stars } from "@/components/ui";
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
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">About Sri Mathru</span>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Bengaluru&apos;s modern driving school, run with <span className="text-brand-600">heart</span>.
        </h1>
        <p className="mt-5 leading-relaxed text-ink-500">
          We started Sri Mathru Driving School with one belief: learning to drive should feel safe, simple and even fun. Over the years we&apos;ve grown into a fully automated school — live slot booking, progress tracking and certificates issued the moment you finish, all without paperwork.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, value: `${stats.students}+`, label: "Students trained" },
          { icon: Car, value: `${stats.instructors}`, label: "Certified instructors" },
          { icon: CalendarCheck2, value: `${stats.lessonsCompleted}+`, label: "Lessons completed" },
          { icon: Award, value: stats.rating.toFixed(1), label: "Average rating" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-ink-100 bg-white p-6 text-center card-shadow">
            <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <s.icon className="size-5" />
            </div>
            <p className="font-display mt-3 text-3xl font-bold text-ink-900">{s.value}</p>
            <p className="mt-1 text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Why students pick us</span>
          <h2 className="font-display mt-3 text-3xl font-bold text-ink-900">Automation that respects your time</h2>
          <div className="mt-6 space-y-5">
            {[
              { icon: Zap, title: "Book in 2 minutes", body: "Pick your course, see live availability, pay online. No phone tag." },
              { icon: ShieldCheck, title: "Verified instructors only", body: "Police-verified, RTO-certified and continuously trained — with real student ratings." },
              { icon: Sparkles, title: "Progress you can see", body: "Every lesson logs your skill scores. Watch yourself get better, chart included." },
              { icon: HeartHandshake, title: "Female-friendly batches", body: "Dedicated female instructors and flexible batches, so everyone feels at home." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
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
        <div className="rounded-3xl bg-ink-900 p-8">
          <h3 className="font-display text-2xl font-bold text-white">What students say</h3>
          <div className="mt-6 space-y-4">
            {topReviews.map((r: ApiData) => (
              <div key={r.id} className="rounded-2xl bg-white/5 p-5">
                <Stars rating={r.rating} size={15} />
                <p className="mt-3 text-sm leading-relaxed text-white/80">&quot;{r.comment}&quot;</p>
                <p className="mt-3 text-xs font-semibold text-brand-300">— {r.student}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 rounded-3xl border border-ink-100 bg-white p-8 card-shadow">
        <h2 className="font-display text-2xl font-bold text-ink-900">Our branches</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.settings.branches?.map((b: ApiData) => (
            <div key={b.id} className="rounded-2xl border border-ink-100 p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MapPin className="size-4.5" />
              </div>
              <h3 className="font-display mt-3 font-bold text-ink-900">{b.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{b.address}</p>
              <p className="mt-2 text-sm font-semibold text-go-600">{b.phone}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-ink-900 px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Ready to start?</h2>
        <p className="max-w-md text-sm text-white/60">Your first lesson could be this week. Book online and pay securely.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/book" className={buttonClasses("primary", "lg")}>Book a course</Link>
          <a href="https://wa.me/919000000001" target="_blank" rel="noreferrer" className={buttonClasses("white", "lg")}>
            <MessageSquareText className="size-4" /> WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
