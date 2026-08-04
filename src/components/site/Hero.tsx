"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Star, ArrowRight, CheckCircle2, MapPin, ShieldCheck, TrendingUp } from "lucide-react";
import { buttonClasses, Stars } from "@/components/ui";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function ProgressRing({ value }: { value: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 72 72" className="size-16 -rotate-90" role="img" aria-label={`${value}% progress`}>
      <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <circle
        cx="36"
        cy="36"
        r={R}
        fill="none"
        stroke="url(#heroRingGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${C} ${C}`}
        strokeDashoffset={C * (1 - value / 100)}
      />
      <defs>
        <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Hero({ stats }: { stats?: { students: number; instructors: number; lessonsCompleted: number; rating: number } }) {
  return (
    <section className="relative overflow-hidden bg-night-950 text-white">
      {/* Ambient background */}
      <div className="bg-grid-dark absolute inset-0" />
      <div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-trust-600/15 blur-3xl" />
      <div className="absolute left-1/2 top-24 h-40 w-[42rem] -translate-x-1/2 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night-950/90 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-28 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-44">
        {/* Copy */}
        <div>
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur-sm">
              <BadgeCheck className="size-4" /> RTO Certified · 4.9★ on Google
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="font-display mt-7 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]"
          >
            Learn to drive the <span className="text-gradient">smart way</span>
            <span className="mt-2 block text-white/95">and pass first time.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            Automatic & manual cars, certified instructors, doorstep pickup and RTO license assistance — booked online in under two minutes, confirmed instantly on WhatsApp.
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/book" className={buttonClasses("primary", "lg", "shadow-glow")}>
              Book a Free Demo <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
            >
              View Courses
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.32)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/55">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-go-500" /> 98% first-attempt pass
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-go-500" /> Doorstep pickup
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-go-500" /> Police-verified mentors
            </span>
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-white/10 pt-8"
          >
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight">{stats?.students ?? 1200}+</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/45">Students Trained</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight">{stats?.lessonsCompleted ?? 8500}+</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/45">Lessons Delivered</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight">{stats?.rating ?? 4.9}★</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/45">Google Rating</p>
            </div>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div {...fadeUp(0.2)} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/20 via-transparent to-trust-600/20 blur-2xl" aria-hidden />

          <div className="glass-dark relative rounded-3xl border border-white/10 p-6 card-shadow-lg">
            {/* Card header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Upcoming Lesson</p>
                <p className="font-display mt-1.5 text-xl font-bold">Tomorrow · 7:30 AM</p>
              </div>
              <span className="animate-pulse-ring flex size-3 rounded-full bg-go-500" aria-hidden />
            </div>

            {/* Instructor + ring */}
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-sm font-bold shadow-lg">
                RK
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Ravi Kumar</p>
                <p className="text-xs text-white/45">Instructor · 4.9★ · 12 yrs</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
                  <Star className="size-3 fill-brand-400 text-brand-400" /> Certified Mentor
                </p>
              </div>
              <div className="relative ml-auto shrink-0">
                <ProgressRing value={85} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-bold">85%</span>
                  <span className="text-[9px] uppercase tracking-wide text-white/45">Steering</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2.5">
              {["Confirmed via WhatsApp + Email", "Payment received · ₹999", "Dual-control vehicle assigned"].map((t) => (
                <div key={t} className="flex items-center gap-2.5 text-sm text-white/70">
                  <CheckCircle2 className="size-4 shrink-0 text-go-500" /> {t}
                </div>
              ))}
            </div>

            {/* Guarantee */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-brand-400/40 bg-brand-500/10 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-brand-300">100% Money-back promise</p>
                <p className="text-sm font-semibold">Free reschedule · 24h before</p>
              </div>
              <ShieldCheck className="size-5 text-brand-400" />
            </div>
          </div>

          {/* Floating testimonial chip */}
          <motion.div
            {...fadeUp(0.55)}
            className="animate-float-slow absolute -bottom-6 -left-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-night-800/95 px-4 py-3 shadow-2xl sm:-left-8"
          >
            <div className="flex flex-col">
              <Stars rating={5} size={13} />
              <p className="mt-1 text-sm font-semibold">&quot;Passed 1st attempt!&quot;</p>
            </div>
          </motion.div>

          {/* Floating progress chip */}
          <motion.div
            {...fadeUp(0.6)}
            className="animate-float absolute -top-5 right-2 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-night-800/95 px-4 py-3 shadow-2xl sm:-right-6"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-go-500/15 text-go-500">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">92% to license</p>
              <p className="text-[10px] text-white/45">Progress synced live</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
