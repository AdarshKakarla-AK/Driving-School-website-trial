"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, CalendarCheck } from "lucide-react";
import { PHONE_TEL, waLink } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

const SHOW_PATHS = ["/", "/courses"];

export function StickyCTA() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (!SHOW_PATHS.includes(pathname)) return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="border-t border-ink-100/80 bg-card/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl card-shadow">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <a
            href={PHONE_TEL}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink-200 text-ink-700 transition active:scale-95"
            aria-label={t("common.callUs")}
          >
            <Phone className="size-5" />
          </a>
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-go-600 text-white shadow-md transition active:scale-95"
            aria-label={t("common.whatsapp")}
          >
            <MessageCircle className="size-5" />
          </a>
          <Link
            href="/book"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(245,158,11,0.6)] transition active:scale-[0.98]"
          >
            <CalendarCheck className="size-4" /> {t("common.bookFreeDemo")}
          </Link>
        </div>
      </div>
    </div>
  );
}
