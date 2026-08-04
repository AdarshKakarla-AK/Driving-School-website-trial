"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Phone, MessageCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6">
      <div className="gradient-border relative overflow-hidden rounded-[2rem] bg-night-950 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-64 w-64 rounded-full bg-trust-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
            <CalendarCheck className="size-4" /> Free demo lessons available this week
          </span>
          <h2 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your license is closer than you think.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/55">
            Book a free demo, feel the car, meet your instructor — then decide. No commitment, no pressure.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/book" className={buttonClasses("primary", "lg", "w-full sm:w-auto shadow-glow")}>
              Book a Free Demo <ArrowRight className="size-4" />
            </Link>
            <a href="tel:+9190000090000" className={buttonClasses("white", "lg", "w-full sm:w-auto")}>
              <Phone className="size-4" /> Call Us
            </a>
            <a
              href="https://wa.me/919000090000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-go-600 px-6 text-base font-semibold text-white shadow-[0_8px_20px_-10px_rgba(16,185,129,0.7)] transition-all hover:bg-go-500 active:scale-[0.98] sm:w-auto"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>

          <p className="mt-6 text-xs text-white/40">Free reschedule up to 24h before · 100% money-back on unused lessons</p>
        </div>
      </div>
    </section>
  );
}
