"use client";

import Link from "next/link";
import { CalendarCheck, UserCheck, CreditCard, CarFront, MessageSquareText, Award, ArrowRight } from "lucide-react";
import { buttonClasses, Eyebrow } from "@/components/ui";

const STEPS = [
  { icon: UserCheck, title: "Register online", desc: "OTP-verified account with your Student ID in seconds — no paperwork." },
  { icon: CalendarCheck, title: "Pick a slot live", desc: "See real-time instructor availability and book instantly, 24/7." },
  { icon: CreditCard, title: "Pay securely", desc: "UPI, cards or EMI via Razorpay. Instant GST invoice + receipt." },
  { icon: CarFront, title: "Get assigned", desc: "Instructor & car auto-assigned. Confirmations via WhatsApp + Email." },
  { icon: MessageSquareText, title: "Learn & track", desc: "Attendance, notes and skill ratings update after every lesson." },
  { icon: Award, title: "Earn your license", desc: "License checklist, mock tests and a verified certificate on completion." },
];

export function Process() {
  return (
    <section className="relative overflow-hidden bg-night-950 py-20 text-white sm:py-24">
      <div className="bg-grid-dark absolute inset-0" />
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-trust-600/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">How It Works</Eyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From signup to license — fully automated</h2>
          <p className="mt-3 text-white/50">A premium, app-like experience. No calls, no queues, no confusion.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:bg-white/[0.07]"
            >
              <span className="font-display pointer-events-none absolute -right-2 -top-5 text-7xl font-extrabold text-white/[0.06] transition-colors group-hover:text-brand-400/10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 shadow-lg transition-transform duration-300 group-hover:scale-105">
                <s.icon className="size-6" />
              </div>
              <h3 className="font-display relative mt-5 text-lg font-bold">{s.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-2 top-1/2 hidden size-5 -translate-y-1/2 text-white/15 lg:block lg:right-0 xl:right-2" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className={buttonClasses("primary", "lg", "shadow-glow")}>
            Create Your Student Account — Free
          </Link>
          <Link href="/courses" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-base font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 active:scale-[0.98]">
            Compare Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
