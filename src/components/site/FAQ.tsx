"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Search } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "Do I need to know how to drive before joining?", a: "Not at all. Most of our students start from zero. Our Beginner Package is designed for absolute beginners, and the first demo session is free." },
  { q: "How do I book or reschedule a lesson?", a: "Login to your student dashboard, open the calendar, and pick any free slot. Rescheduling is free up to 24 hours before a lesson — the slot reopens instantly and you get a new confirmation on WhatsApp." },
  { q: "Which vehicles do you teach on?", a: "We have both manual (Swift, Dzire, Alto) and automatic (i10 AMT, Comet EV, Verna) cars. You can choose your preference at registration or switch later." },
  { q: "Do you help with the learner's license and driving test?", a: "Yes. The License Assistance package covers the learner's permit application, eye test coordination, RTO slot booking, mock tests and test-day support. Our RTO specialists have a 98% first-attempt pass rate." },
  { q: "What payment options do you accept?", a: "UPI, cards, net banking and wallets via Razorpay, plus EMI plans on most packages. You get a GST invoice and receipt automatically after every payment." },
  { q: "What if I need to cancel a lesson?", a: "Cancellations at least 24 hours ahead get a full refund to your original payment method. Within 24 hours, a 10% fee applies. Our system handles the refund and notifies your instructor automatically." },
  { q: "Are female instructors available?", a: "Yes — we have dedicated female instructors and women-first batches, with a comfortable, judgment-free learning environment." },
  { q: "Do you pick up students from home?", a: "Doorstep pickup is included with most packages within our service area in Bengaluru. Confirm your address at registration." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const filtered = FAQS.filter(
    (f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="text-center">
        <Eyebrow className="justify-center">FAQ</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Everything you need to know</h2>
        <p className="mt-3 text-ink-500">Search or browse — most questions are answered in seconds.</p>
      </div>

      <div className="relative mx-auto mt-8 max-w-xl">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(null);
          }}
          placeholder="Search questions, e.g. refund, licence, pickup…"
          className="h-12 w-full rounded-2xl border border-ink-200 bg-card pl-11 pr-4 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <div className="mt-8 space-y-3">
        {filtered.map((f) => {
          const idx = FAQS.indexOf(f);
          const isOpen = open === idx;
          return (
            <div
              key={idx}
              className={cn(
                "card-shadow overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                isOpen ? "border-brand-300/60 ring-1 ring-brand-400/20" : "border-ink-100"
              )}
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-ink-900">{f.q}</span>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full transition-all", isOpen ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500")}>
                  <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>
              {isOpen && <p className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-500 sm:px-6">{f.a}</p>}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-card px-6 py-10 text-center text-sm text-ink-400">
            No results for &quot;{query}&quot; — try a different keyword or ask our AI assistant below.
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-ink-500">
        Still have questions?{" "}
        <span className="inline-flex items-center gap-1.5 font-semibold text-go-600">
          <MessageCircle className="size-4" /> Chat with Sathi, our AI assistant, or WhatsApp +91 90000 90000
        </span>
      </p>
    </section>
  );
}
