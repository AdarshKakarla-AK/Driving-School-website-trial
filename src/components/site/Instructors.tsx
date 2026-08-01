"use client";

import Link from "next/link";
import { GraduationCap, Languages, Award, ArrowRight, Star } from "lucide-react";
import { Avatar, Badge, buttonClasses } from "@/components/ui";
import type { User } from "@/lib/db/types";

export function Instructors({ instructors }: { instructors: User[] }) {
  return (
    <section className="bg-card py-20 border-y border-ink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Meet Your Mentors</span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Learn from Bengaluru&apos;s best instructors</h2>
            <p className="mt-3 text-ink-500">Certified, background-verified and rated 4.8+ by thousands of students.</p>
          </div>
          <Link href="/instructors" className="hidden items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex dark:text-brand-400">
            View all instructors <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.slice(0, 4).map((inst) => (
            <div key={inst.id} className="card-shadow group rounded-3xl border border-ink-100 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <Avatar name={inst.name} color={inst.avatarColor} size="lg" />
                <div>
                  <h3 className="font-display font-bold text-ink-900">{inst.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                    <Star className="size-3.5 text-brand-500" fill="currentColor" /> {inst.rating?.toFixed(1)} · {inst.reviewCount} reviews
                  </div>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-500">{inst.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {inst.specialization?.slice(0, 3).map((s) => (
                  <Badge key={s} tone="ink">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-ink-500">
                <p className="flex items-center gap-2">
                  <GraduationCap className="size-3.5 text-brand-500" /> {inst.yearsExp} years experience
                </p>
                <p className="flex items-center gap-2">
                  <Languages className="size-3.5 text-brand-500" /> {inst.languages?.join(", ")}
                </p>
                <p className="flex items-center gap-2">
                  <Award className="size-3.5 text-brand-500" /> {inst.certifications?.[0]}
                </p>
              </div>
              <Link href="/courses" className={buttonClasses("outline", "sm", "mt-5 w-full")}>
                Book {inst.name.split(" ")[0]}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
