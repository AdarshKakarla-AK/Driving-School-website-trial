"use client";

import * as React from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { api, type ApiData } from "@/lib/client";
import { formatINR } from "@/lib/utils";
import { WA_NUMBER } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

interface Msg {
  from: "bot" | "user";
  text: string;
}

const QUICK = ["chat.quick1", "chat.quick2", "chat.quick3", "chat.quick4", "chat.quick5", "chat.quick6"];

export function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { from: "bot", text: t("chat.greeting") },
  ]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  const respond = React.useCallback(async (text: string): Promise<string> => {
    const t = text.toLowerCase();
    const { packages, settings } = await api<{ packages: ApiData[]; settings: ApiData }>("/api/public/packages");

    if (/(fee|price|cost|rate|emi|charge)/.test(t)) {
      const top = packages.slice(0, 5);
      return (
        "Here are our top packages:\n" +
        top.map((p) => `• ${p.name} — ${formatINR(p.price)}${p.emi ? ` (EMI from ${formatINR(p.emi.downPayment)} down)` : ""}`).join("\n") +
        '\n\nUse the "Book Lesson" button on the Courses page to book instantly!'
      );
    }
    if (/(time|hour|timing|schedule|when)/.test(t)) {
      return `We're open ${settings.openingHours}. Lessons are available in morning (6-11 AM) and evening (4-8 PM) batches, including weekends. Pick any free slot in real-time when you book online.`;
    }
    if (/(document|paper|aadhaar|license|medical|photo)/.test(t)) {
      return "You'll need:\n• Aadhaar card\n• 3 passport photos\n• Age proof (if under 18)\n• Medical certificate (for the license test)\n\nWe'll remind you before anything expires and guide you through the learner's permit online.";
    }
    if (/(book|slot|lesson|schedule)/.test(t)) {
      return "Great! Just hit the 'Book Now' button, pick your course, and choose a live slot from the calendar. You'll get an instant WhatsApp + email confirmation. Need an account first? Register free in under a minute.";
    }
    if (/(cancel|refund)/.test(t)) {
      return "You can cancel from your dashboard up to 24h before a lesson for a full refund. Within 24h, a 10% fee applies. Slots reopen instantly and WhatsApp confirmations are sent automatically.";
    }
    if (/(branch|location|where|address|area)/.test(t)) {
      return settings.branches.map((b: ApiData) => `📍 ${b.name}: ${b.address}`).join("\n");
    }
    if (/(instructor|teacher|mentor)/.test(t)) {
      return "We have 4+ certified instructors rated 4.7-4.9★, including female instructors. You can view their profiles and even request a specific instructor when booking.";
    }
    if (/(contact|call|phone|whatsapp|number)/.test(t)) {
      return `You can reach us at ${settings.phone} or WhatsApp the same number at +${WA_NUMBER}. Or drop your number on the contact form and we'll call you within 24 hours.`;
    }
    return "I can help with courses & fees, timings, documents, booking, cancellation, branches and contact info. Try one of those, or talk to a human via WhatsApp anytime!";
  }, []);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text }]);
    setTyping(true);
    const reply = await respond(text);
    setTyping(false);
    setMsgs((m) => [...m, { from: "bot", text: reply }]);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-xl transition hover:scale-105 lg:bottom-5"
          aria-label={t("chat.open")}
        >
          <Bot className="size-7" />
        </button>
      )}

      {open && (
        <div className="no-print fixed bottom-24 right-5 z-50 flex h-[70vh] min-h-[380px] max-h-[600px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-ink-100 lg:bottom-5">
          <div className="flex items-center justify-between bg-night-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600">
                <Bot className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-night-900 bg-go-500" />
              </div>
              <div>
                <p className="text-sm font-bold">{t("chat.header")}</p>
                <p className="text-xs text-white/50">{t("chat.online")}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                    m.from === "user" ? "rounded-br-sm bg-gradient-to-b from-brand-400 to-brand-600 text-white" : "rounded-bl-sm bg-card text-ink-800 shadow-sm dark:text-ink-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3.5 py-3 shadow-sm">
                  <Loader2 className="size-4 animate-spin text-brand-500" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-ink-100 bg-card p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(t(q))} className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 hover:border-brand-400 hover:text-brand-600 dark:text-ink-200">
                  {t(q)}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="h-10 flex-1 rounded-xl border border-ink-200 bg-card px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              />
              <button type="submit" className="flex size-10 items-center justify-center rounded-xl bg-night-900 text-white hover:bg-night-800" aria-label={t("chat.send")}>
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
