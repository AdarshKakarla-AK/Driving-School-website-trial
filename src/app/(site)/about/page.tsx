"use client";

import * as React from "react";
import Image from "next/image";
import { Award, CalendarCheck2, Car, HeartHandshake, MapPin, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { Spinner, Stars, Eyebrow } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { api, type ApiData } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const [data, setData] = React.useState<ApiData>(null);
  const { t } = useI18n();

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
      <div className="relative h-72 overflow-hidden bg-night-950 sm:h-80">
        <Image src="/images/team.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-night-950/40 to-night-950/20" />
      </div>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={
          <>
            {t("about.title1")} <span className="text-gradient">{t("about.title2")}</span>.
          </>
        }
        subtitle={t("about.subtitle")}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, value: `${stats.students}+`, label: t("about.s1") },
            { icon: Car, value: `${stats.instructors}`, label: t("about.s2") },
            { icon: CalendarCheck2, value: `${stats.lessonsCompleted}+`, label: t("about.s3") },
            { icon: Award, value: stats.rating.toFixed(1), label: t("about.s4") },
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
            <Eyebrow>{t("about.whyEyebrow")}</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900">{t("about.whyTitle")}</h2>
            <div className="mt-7 space-y-5">
              {[
                { icon: Zap, title: t("about.w1t"), body: t("about.w1d") },
                { icon: ShieldCheck, title: t("about.w2t"), body: t("about.w2d") },
                { icon: Sparkles, title: t("about.w3t"), body: t("about.w3d") },
                { icon: HeartHandshake, title: t("about.w4t"), body: t("about.w4d") },
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
              <h3 className="font-display text-2xl font-bold text-white">{t("about.sayTitle")}</h3>
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
            <h2 className="font-display text-2xl font-bold text-ink-900">{t("about.branchesTitle")}</h2>
            <span className="text-sm text-ink-400">{t("about.branchHours")}</span>
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
