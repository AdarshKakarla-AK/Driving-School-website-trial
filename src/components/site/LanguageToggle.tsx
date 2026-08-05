"use client";

import * as React from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "hi", label: "हिंदी" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-ink-200 bg-card p-0.5 text-ink-600",
        className
      )}
      role="group"
      aria-label="Select language"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLocale(o.code)}
          aria-pressed={locale === o.code}
          className={cn(
            "rounded-[0.6rem] px-2 py-1.5 text-xs font-bold transition-colors",
            locale === o.code
              ? "bg-brand-500 text-white shadow"
              : "text-current opacity-60 hover:opacity-100"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
