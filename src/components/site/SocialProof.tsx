"use client";

import * as React from "react";
import { ShieldCheck, Star, TrendingUp, Users, CalendarCheck, CarFront, MessageCircle, CreditCard } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ITEMS = [
  { icon: ShieldCheck, key: "socialProof.rto" },
  { icon: Star, key: "socialProof.rating" },
  { icon: TrendingUp, key: "socialProof.pass" },
  { icon: Users, key: "socialProof.students" },
  { icon: CalendarCheck, key: "socialProof.lessons" },
  { icon: CarFront, key: "socialProof.fleet" },
  { icon: MessageCircle, key: "socialProof.whatsapp" },
  { icon: CreditCard, key: "socialProof.payments" },
];

export function SocialProof({ stats }: { stats?: { students?: number; lessonsCompleted?: number; rating?: number } }) {
  const { t } = useI18n();
  const labelFor = (item: { icon: React.ComponentType<{ className?: string }>; key: string }): string => {
    switch (item.key) {
      case "socialProof.students":
        return `${(stats?.students ?? 1200).toLocaleString("en-IN")}+ ${t("socialProof.students")}`;
      case "socialProof.lessons":
        return `${(stats?.lessonsCompleted ?? 8500).toLocaleString("en-IN")}+ ${t("socialProof.lessons")}`;
      case "socialProof.rating":
        return `${stats?.rating ?? 4.9}★ ${t("socialProof.googleRating")}`;
      default:
        return t(item.key);
    }
  };
  const row = [...ITEMS, ...ITEMS];
  return (
    <section className="border-b border-ink-100 bg-card py-8" aria-label="Trust and certifications">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-ink-400">
          {t("socialProof.headline")}
        </p>
        <div className="relative mt-5 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-card to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-card to-transparent" aria-hidden />
          <div className="animate-marquee flex w-max items-center gap-12">
            {row.map((item, i) => (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-ink-500 dark:text-ink-300">
                <item.icon className="size-4.5 text-brand-500" />
                {labelFor(item)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
