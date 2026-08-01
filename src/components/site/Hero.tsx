"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck, BadgeCheck, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonClasses, Stars } from "@/components/ui";

export function Hero({ stats }: { stats?: { students: number; instructors: number; lessonsCompleted: number; rating: number } }) {
  return (
    <section className="relative overflow-hidden bg-night-950 text-white">
      <div className="bg-grid-dark absolute inset-0" />
      <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night-950/80 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-40">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-300">
              <BadgeCheck className="size-4" /> RTO Certified · Bengaluru&apos;s Most Loved
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Learn to drive the <span className="text-gradient">smart way</span>. Book online, pass first time.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 max-w-lg text-lg text-white/60"
          >
            Automatic & manual cars, certified instructors, doorstep pickup and license assistance — all managed from your phone, no calls needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/courses" className={buttonClasses("primary", "lg")}>
              <CalendarCheck className="size-5" /> Book a Free Demo
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-night-900 shadow-sm transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              View Courses <ArrowRight className="size-5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <div>
              <p className="font-display text-2xl font-bold">{stats?.students ?? 1200}+</p>
              <p className="text-xs text-white/50">Students Trained</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{stats?.lessonsCompleted ?? 8500}+</p>
              <p className="text-xs text-white/50">Lessons Delivered</p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="font-display text-2xl font-bold">{stats?.rating ?? 4.9}★</p>
                <p className="text-xs text-white/50">Google Rating</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="relative mx-auto w-full max-w-md lg:mx-0"
        >
          <div className="card-shadow-lg relative rounded-3xl border border-white/10 bg-night-800/90 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Next Lesson</p>
                <p className="font-display mt-1 text-lg font-bold">Tomorrow · 7:30 AM</p>
              </div>
              <span className="animate-pulse-ring flex size-3 rounded-full bg-go-500" />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 font-bold text-white">
                RK
              </div>
              <div>
                <p className="text-sm font-semibold">Ravi Kumar</p>
                <p className="text-xs text-white/50">Instructor · 4.9</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-white/50">Vehicle</p>
                <p className="text-sm font-semibold">White Swift</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {["Lesson confirmed via WhatsApp", "Payment received · ₹999", "Progress: Steering ⭐⭐⭐⭐"].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                  <CheckCircle2 className="size-4 text-go-500" /> {t}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-brand-400/40 bg-brand-500/10 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-brand-300">Refund policy</p>
                <p className="text-sm font-semibold">Free reschedule 24h before</p>
              </div>
              <Star className="size-5 text-brand-400" fill="currentColor" />
            </div>
          </div>
          <div className="animate-float absolute -bottom-6 -left-4 rounded-2xl bg-night-800 px-4 py-3 shadow-xl ring-1 ring-white/10 sm:-left-10">
            <div className="flex items-center gap-2">
              <Stars rating={5} />
              <span className="text-sm font-semibold">&quot;Passed 1st attempt!&quot;</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
