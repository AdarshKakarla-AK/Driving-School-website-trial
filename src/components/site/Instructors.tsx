"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Languages, Award, ArrowRight, BadgeCheck, Star } from "lucide-react";
import { Avatar, Badge, buttonClasses, Eyebrow } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { User } from "@/lib/db/types";

export function Instructors({ instructors }: { instructors: User[] }) {
  const { t } = useI18n();
  return (
    <section className="bg-card py-20 border-b border-ink-100 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Eyebrow>{t("instructors.eyebrow")}</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t("instructors.title")}
            </h2>
            <p className="mt-3 text-ink-500">{t("instructors.subtitle")}</p>
          </div>
          <Link href="/instructors" className="group hidden items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex dark:text-brand-400">
            {t("instructors.viewAll")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.slice(0, 4).map((inst) => (
            <div key={inst.id} className="card-shadow group relative flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-20 overflow-hidden bg-night-950">
                <Image src="/images/driving-lesson.jpg" alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-night-950/40 to-transparent" />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-go-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-go-500 ring-1 ring-go-500/25">
                  <BadgeCheck className="size-3" /> {t("instructors.verified")}
                </span>
              </div>
              <div className="relative -mt-8 px-5">
                <div className="rounded-2xl border-4 border-card shadow-sm">
                  <Avatar name={inst.name} color={inst.avatarColor} size="lg" />
                </div>
              </div>

              <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
                <h3 className="font-display text-lg font-bold text-ink-900">{inst.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                  <Star className="size-3.5 fill-brand-500 text-brand-500" />
                  <span className="font-semibold text-ink-700">{inst.rating?.toFixed(1)}</span>
                  <span>· {t("instructors.reviews", { n: inst.reviewCount ?? 0 })}</span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-500">{inst.bio}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {inst.specialization?.slice(0, 3).map((s) => (
                    <Badge key={s} tone="ink">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-xs text-ink-500">
                  <p className="flex items-center gap-2">
                    <GraduationCap className="size-3.5 text-brand-500" /> {t("instructors.yearsExp", { n: inst.yearsExp ?? 0 })}
                  </p>
                  <p className="flex items-center gap-2">
                    <Languages className="size-3.5 text-brand-500" /> {inst.languages?.join(", ")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Award className="size-3.5 text-brand-500" /> {inst.certifications?.[0]}
                  </p>
                </div>

                <Link href="/courses" className={buttonClasses("outline", "sm", "mt-5 w-full group-hover:border-brand-400")}>
                  {t("instructors.book", { name: inst.name.split(" ")[0] })}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Link href="/instructors" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {t("instructors.viewAll")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
