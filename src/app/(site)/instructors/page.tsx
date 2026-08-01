"use client";

import * as React from "react";
import Link from "next/link";
import { Award, BadgeCheck, BookOpenCheck, CarFront, Languages, Phone, ShieldCheck } from "lucide-react";
import { Avatar, Badge, buttonClasses, Card, Spinner, Stars } from "@/components/ui";
import { api } from "@/lib/client";
import type { User, Vehicle } from "@/lib/db/types";

export default function InstructorsPage() {
  const [data, setData] = React.useState<{ instructors: User[]; vehicles: Vehicle[] } | null>(null);

  React.useEffect(() => {
    api<{ instructors: User[]; vehicles: Vehicle[] }>("/api/public/instructors").then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Our Team</span>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">Meet your instructors</h1>
        <p className="mt-4 text-ink-500">
          Every instructor is RTO-certified, police-verified and rated by real students. Pick someone you&apos;re comfortable with — female batches available.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {data.instructors.map((i) => (
          <Card key={i.id} className="group overflow-hidden p-0">
            <div className="relative h-28 bg-gradient-to-br from-ink-800 to-ink-900">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_80%,#14b8a6_0,transparent_50%),radial-gradient(circle_at_90%_20%,#f59e0b_0,transparent_40%)]" />
              <div className="absolute -bottom-9 left-5 rounded-2xl border-4 border-card">
                <Avatar name={i.name} size="lg" color={i.avatarColor} />
              </div>
              <Badge tone="green" className="absolute right-3 top-3">
                <BadgeCheck className="size-3" /> Verified
              </Badge>
            </div>
            <div className="p-5 pt-12">
              <h3 className="font-display text-lg font-bold text-ink-900">{i.name}</h3>
              <p className="mt-0.5 text-xs text-ink-400">{i.yearsExp} years experience</p>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={i.rating ?? 0} size={14} />
                <span className="text-xs font-semibold text-ink-700">{i.rating?.toFixed(1)}</span>
                <span className="text-xs text-ink-400">({i.reviewCount} reviews)</span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-500">{i.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(i.specialization ?? []).map((s) => (
                  <Badge key={s} tone="blue">{s}</Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                <span className="flex items-center gap-1"><Languages className="size-3.5" /> {(i.languages ?? []).join(", ")}</span>
                <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1 font-semibold text-go-600 hover:underline">
                  <Phone className="size-3" /> Call
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Police verified", body: "Background-checked and RTO-certified instructors for your safety." },
          { icon: Award, title: "98% pass rate", body: "Our license-prep instructors get students through RTO on the first attempt." },
          { icon: BookOpenCheck, title: "Ongoing training", body: "Instructors attend monthly skill refreshers to keep teaching quality high." },
        ].map((f) => (
          <div key={f.title} className="card-shadow rounded-3xl border border-ink-100 bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-display mt-3 font-bold text-ink-900">{f.title}</h3>
            <p className="mt-1 text-sm text-ink-500">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-night-900 px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Not sure who to pick?</h2>
        <p className="max-w-md text-sm text-white/60">Book a free demo session — try the instructor, then decide. No commitment.</p>
        <Link href="/book" className={buttonClasses("primary", "lg")}>
          <CarFront className="size-4" /> Book free demo
        </Link>
      </div>
    </div>
  );
}
