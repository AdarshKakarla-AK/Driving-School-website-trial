"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Eyebrow, buttonClasses } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { CoursePackage } from "@/lib/db/types";

const MAX_COLUMNS = 6;

const LABEL = "sticky left-0 z-10 border-b border-ink-100 bg-card px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-ink-400 sm:px-6";
const VALUE = "border-b border-ink-100 px-4 py-3 text-ink-700 transition group-hover:bg-ink-50/70 dark:text-ink-300 dark:group-hover:bg-ink-100/10 sm:px-5";

export function ComparePackages({ packages }: { packages: CoursePackage[] }) {
  const list = packages.slice(0, MAX_COLUMNS);
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow className="justify-center">{t("compare.eyebrow")}</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {t("compare.title")}
        </h2>
        <p className="mt-3 text-ink-500">{t("compare.subtitle")}</p>
      </div>

      <div className="mt-10 overflow-x-auto rounded-3xl border border-ink-100 bg-card">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={LABEL} scope="col">
                {t("compare.compare")}
              </th>
              {list.map((p) => (
                <th key={p.id} className="sticky top-0 z-10 border-b border-ink-100 bg-card px-4 py-4 text-left align-top sm:px-5" scope="col">
                  <span className="font-display text-lg font-bold text-gradient">{p.name}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.vehicleType === "both" ? (
                      <Badge tone="ink">{t("common.anyVehicle")}</Badge>
                    ) : (
                      <Badge tone={p.vehicleType === "automatic" ? "blue" : "ink"}>
                        {p.vehicleType === "automatic" ? t("common.automatic") : t("common.manual")}
                      </Badge>
                    )}
                    {p.popular && <Badge tone="brand">{t("common.mostPopular")}</Badge>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.sessions")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={VALUE}>
                  {t("compare.sessionsValue", { n: p.sessions })}
                </td>
              ))}
            </tr>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.duration")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={VALUE}>
                  {t("compare.weeks", { n: p.durationWeeks })}
                </td>
              ))}
            </tr>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.vehicleType")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={VALUE}>
                  {p.vehicleType === "both" ? t("compare.anyManualAuto") : p.vehicleType === "automatic" ? t("common.automatic") : t("common.manual")}
                </td>
              ))}
            </tr>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.price")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={VALUE}>
                  <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">{formatINR(p.price)}</span>
                  {p.originalPrice && <span className="ml-1.5 text-xs text-ink-400 line-through">{formatINR(p.originalPrice)}</span>}
                  {p.emi ? (
                    <p className="mt-1 text-xs text-ink-400">
                      {t("compare.emiFrom", { down: formatINR(p.emi.downPayment), months: p.emi.months, monthly: formatINR(p.emi.monthly) })}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink-400">{t("compare.payInFull")}</p>
                  )}
                </td>
              ))}
            </tr>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.includes")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={VALUE}>
                  <div className="flex flex-wrap items-center gap-1">
                    {p.includes.slice(0, 2).map((f: string) => (
                      <span key={f} className="rounded-full bg-go-500/10 px-2 py-0.5 text-xs font-medium text-go-600 dark:text-go-500">
                        {f}
                      </span>
                    ))}
                    {p.includes.length > 2 && <span className="text-xs text-ink-400">{t("compare.more", { n: p.includes.length - 2 })}</span>}
                  </div>
                </td>
              ))}
            </tr>
            <tr className="group">
              <th scope="row" className={LABEL}>
                {t("compare.book")}
              </th>
              {list.map((p) => (
                <td key={p.id} className={`${VALUE} border-b-0`}>
                  <Link href={`/book?pkg=${p.slug}`} className={buttonClasses("outline", "sm")}>
                    {t("common.book")} <ArrowRight className="size-3.5" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
