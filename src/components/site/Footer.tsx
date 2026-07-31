"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, AtSign, Globe, Share2 } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="no-print bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Logo dark />
            <p className="text-sm leading-relaxed text-ink-400">
              Bengaluru&apos;s premium driving school. Online booking, certified instructors and real progress tracking —
              from learner permit to license.
            </p>
            <div className="flex gap-2">
              {[AtSign, Globe, Share2].map((Icon, i) => (
                <a key={i} href="#" className="rounded-lg bg-white/5 p-2 text-ink-300 transition hover:bg-brand-500 hover:text-white" aria-label="Social link">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-white">Courses</h4>
            <ul className="space-y-2.5 text-sm">
              {["Beginner Package", "Automatic Car Course", "License Assistance", "Night Driving", "Luxury Car Training"].map((c) => (
                <li key={c}>
                  <Link href="/courses" className="text-ink-400 transition hover:text-brand-400">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/instructors", label: "Our Instructors" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact & Branches" },
                { href: "/register", label: "Student Registration" },
                { href: "/login", label: "Student Login" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-400 transition hover:text-brand-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Reach Us</h4>
            <p className="flex items-start gap-2.5 text-ink-400">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
              #12, 4th Cross, Banashankari 2nd Stage, Bengaluru - 560070
            </p>
            <p className="flex items-center gap-2.5 text-ink-400">
              <Phone className="size-4 shrink-0 text-brand-500" /> +91 90000 90000
            </p>
            <p className="flex items-center gap-2.5 text-ink-400">
              <Mail className="size-4 shrink-0 text-brand-500" /> hello@srimathru.in
            </p>
            <p className="flex items-center gap-2.5 text-ink-400">
              <Clock className="size-4 shrink-0 text-brand-500" /> Mon-Sat · 6 AM – 8 PM
            </p>
            <a
              href="https://wa.me/919000090000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-go-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-go-500"
            >
              <MessageCircle className="size-4" /> WhatsApp Us
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Sri Mathru Driving School. All rights reserved.</p>
          <p>
            GSTIN <span className="text-ink-300">29ABCDE1234F1Z5</span> · Demo experience — all data is sample data
          </p>
        </div>
      </div>
    </footer>
  );
}
