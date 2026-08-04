"use client";

import * as React from "react";
import { Award, BadgeCheck, BookOpenCheck, Languages, Phone, ShieldCheck } from "lucide-react";
import { Avatar, Badge, Card, Spinner, Stars } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
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
    <>
      <PageHero
        eyebrow="Our Team"
        title={<>Meet your instructors</>}
        subtitle="Every instructor is RTO-certified, police-verified and rated by real students. Pick someone you're comfortable with — female batches available."
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.instructors.map((i) => (
            <Card key={i.id} className="group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-28 bg-gradient-to-br from-ink-800 via-ink-900 to-night-950">
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.5)_0,transparent_50%),radial-gradient(circle_at_90%_20%,rgba(245,158,11,0.6)_0,transparent_40%)]" />
                <div className="absolute inset-0 bg-grid-dark" />
                <div className="absolute -bottom-9 left-5 rounded-2xl border-4 border-card shadow-md">
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
                    <Badge key={s} tone="blue">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <Languages className="size-3.5" /> {(i.languages ?? []).join(", ")}
                  </span>
                  <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1 font-semibold text-go-600 hover:underline">
                    <Phone className="size-3" /> Call
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Police verified", body: "Background-checked and RTO-certified instructors for your safety." },
            { icon: Award, title: "98% pass rate", body: "Our license-prep instructors get students through RTO on the first attempt." },
            { icon: BookOpenCheck, title: "Ongoing training", body: "Instructors attend monthly skill refreshers to keep teaching quality high." },
          ].map((f) => (
            <div key={f.title} className="card-shadow rounded-3xl border border-ink-100 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display mt-3 font-bold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      <FinalCTA />
    </>
  );
}
