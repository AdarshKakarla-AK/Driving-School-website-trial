"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, AtSign, Globe, Share2, ShieldCheck, Star } from "lucide-react";
import { Logo } from "./Logo";

const COURSES = ["Beginner Package", "Automatic Car Course", "License Assistance", "Night Driving", "Luxury Car Training"];

const COMPANY = [
  { href: "/instructors", label: "Our Instructors" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact & Branches" },
  { href: "/register", label: "Student Registration" },
  { href: "/login", label: "Student Login" },
  { href: "/#fleet", label: "Our Fleet" },
];

export function Footer() {
  return (
    <footer className="no-print relative overflow-hidden bg-night-950 text-white/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden />
      <div className="absolute -top-24 left-1/4 h-56 w-96 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 lg:pb-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.1fr]">
          <div className="space-y-5">
            <Logo dark />
            <p className="max-w-sm text-sm leading-relaxed text-white/50">
              Bengaluru&apos;s premium driving school. Online booking, certified instructors and real progress tracking — from learner permit to license.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-300 ring-1 ring-white/10">
                <Star className="size-3.5 fill-brand-400 text-brand-400" /> 4.9 on Google
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-go-500 ring-1 ring-white/10">
                <ShieldCheck className="size-3.5" /> RTO Certified
              </span>
            </div>
            <div className="flex gap-2">
              {[AtSign, Globe, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/50 transition hover:border-brand-400/50 hover:bg-brand-500 hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-[0.15em] text-white">Courses</h4>
            <ul className="space-y-2.5 text-sm">
              {COURSES.map((c) => (
                <li key={c}>
                  <Link href="/courses" className="text-white/50 transition hover:text-brand-400">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-[0.15em] text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {COMPANY.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-white/50 transition hover:text-brand-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-white">Reach Us</h4>
            <p className="flex items-start gap-2.5 text-white/50">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-400" />
              #12, 4th Cross, Banashankari 2nd Stage, Bengaluru - 560070
            </p>
            <p className="flex items-center gap-2.5 text-white/50">
              <Phone className="size-4 shrink-0 text-brand-400" /> +91 90000 90000
            </p>
            <p className="flex items-center gap-2.5 text-white/50">
              <Mail className="size-4 shrink-0 text-brand-400" /> hello@srimathru.in
            </p>
            <p className="flex items-center gap-2.5 text-white/50">
              <Clock className="size-4 shrink-0 text-brand-400" /> Mon-Sat · 6 AM – 8 PM
            </p>
            <a
              href="https://wa.me/919000090000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-go-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(16,185,129,0.6)] transition hover:bg-go-500"
            >
              <MessageCircle className="size-4" /> WhatsApp Us
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Sri Mathru Driving School. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-1.5">
            <ShieldCheck className="size-3.5 text-go-500" />
            GSTIN <span className="text-white/60">29ABCDE1234F1Z5</span> · Demo experience — all data is sample data
          </p>
        </div>
      </div>
    </footer>
  );
}
