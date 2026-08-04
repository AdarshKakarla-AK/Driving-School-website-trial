"use client";

import { ShieldCheck, Star, TrendingUp, Users, CalendarCheck, CarFront, MessageCircle, CreditCard } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "RTO Certified" },
  { icon: Star, label: "4.9★ Google Rating" },
  { icon: TrendingUp, label: "98% First-Time Pass" },
  { icon: Users, label: "1200+ Students" },
  { icon: CalendarCheck, label: "8500+ Lessons" },
  { icon: CarFront, label: "Dual-Control Fleet" },
  { icon: MessageCircle, label: "24/7 WhatsApp Support" },
  { icon: CreditCard, label: "Secure Razorpay Payments" },
];

export function SocialProof() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section className="border-b border-ink-100 bg-card py-8" aria-label="Trust and certifications">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-ink-400">
          Trusted by Bengaluru drivers — every day
        </p>
        <div className="relative mt-5 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-card to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-card to-transparent" aria-hidden />
          <div className="animate-marquee flex w-max items-center gap-12">
            {row.map((item, i) => (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-ink-500 dark:text-ink-300">
                <item.icon className="size-4.5 text-brand-500" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
