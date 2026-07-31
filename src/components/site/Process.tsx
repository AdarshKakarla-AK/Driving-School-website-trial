"use client";

import Link from "next/link";
import { CalendarCheck, UserCheck, CreditCard, CarFront, MessageSquareText, Award } from "lucide-react";
import { buttonClasses } from "@/components/ui";

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
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white">
      <div className="bg-grid-dark absolute inset-0" />
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">How It Works</span>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From signup to license — fully automated</h2>
          <p className="mt-3 text-ink-400">A premium, app-like experience. No calls, no queues, no confusion.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-brand-500/40 hover:bg-white/10">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 shadow-lg">
                  <s.icon className="size-6" />
                </div>
                <span className="font-display text-4xl font-bold text-white/10">0{i + 1}</span>
              </div>
              <h3 className="font-display mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className={buttonClasses("primary", "lg")}>
            Create Your Student Account — Free
          </Link>
          <Link href="/courses" className={buttonClasses("white", "lg")}>
            Compare Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
