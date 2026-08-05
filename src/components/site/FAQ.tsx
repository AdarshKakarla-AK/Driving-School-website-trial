"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Search } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";
import { waLink, WA_NUMBER } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

const FAQS = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
  { q: "faq.q7", a: "faq.a7" },
  { q: "faq.q8", a: "faq.a8" },
];

export function FAQ() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const filtered = FAQS.map((f) => ({ q: t(f.q), a: t(f.a) })).filter(
    (f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="text-center">
        <Eyebrow className="justify-center">{t("faq.eyebrow")}</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{t("faq.title")}</h2>
        <p className="mt-3 text-ink-500">{t("faq.subtitle")}</p>
      </div>

      <div className="relative mx-auto mt-8 max-w-xl">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(null);
          }}
          placeholder={t("faq.searchPlaceholder")}
          className="h-12 w-full rounded-2xl border border-ink-200 bg-card pl-11 pr-4 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <div className="mt-8 space-y-3">
        {filtered.map((f, idx) => {
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
            {t("faq.noResults", { query })}
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-ink-500">
        {t("faq.stillQuestions")}{" "}
        <span className="inline-flex items-center gap-1.5 font-semibold text-go-600">
          <MessageCircle className="size-4" /> {t("faq.chatWith")}{" "}
          <a href={waLink()} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-go-500">
            WhatsApp +{WA_NUMBER}
          </a>
        </span>
      </p>
    </section>
  );
}
