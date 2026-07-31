"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
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
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">FAQ</span>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Everything you need to know</h2>
      </div>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="card-shadow overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
              <span className="font-semibold text-ink-900">{f.q}</span>
              <ChevronDown className={cn("size-5 shrink-0 text-ink-400 transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && <p className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-500">{f.a}</p>}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-ink-500">
        Still have questions?{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-go-600">
          <MessageCircle className="size-4" /> Chat with our AI assistant or WhatsApp +91 90000 90000
        </span>
      </p>
    </section>
  );
}
