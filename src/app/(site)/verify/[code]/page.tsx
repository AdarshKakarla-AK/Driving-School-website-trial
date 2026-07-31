import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { PrintButton } from "@/components/site/PrintButton";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/certificates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!res.ok) notFound();
  const data = await res.json();
  const c = data.certificate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 via-ink-900 to-ink-800 px-4 py-10 text-ink-900">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Cinzel:wght@700&display=swap');`}</style>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Logo className="h-9 w-auto" dark />
          </div>
          <Link href="/" className="text-sm text-white/60 hover:text-white">← Back to site</Link>
        </div>

        <div id="certificate" className="relative overflow-hidden rounded-2xl bg-[#fdf9ef] p-2 shadow-2xl">
          <div className="rounded-xl border-[3px] border-double border-brand-700/40 px-6 py-10 sm:px-10">
            <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_15%_20%,#0f766e_0,transparent_40%),radial-gradient(circle_at_85%_80%,#b45309_0,transparent_40%)]" />
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.3em] text-amber-700 uppercase">Certificate of Completion</p>
              <h1 style={{ fontFamily: "Playfair Display, serif" }} className="mt-2 text-4xl font-extrabold text-ink-900 sm:text-5xl">
                {c.student}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm text-ink-600">
                has successfully completed the professional driving course
              </p>
              <p style={{ fontFamily: "Cinzel, serif" }} className="mt-2 text-2xl font-bold text-brand-700">
                {c.package}
              </p>
              <p className="mt-1 text-sm text-ink-500">at Sri Mathru Driving School · Bengaluru</p>

              <div className="mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-6 text-sm">
                <div className="border-t-2 border-ink-300 pt-2">
                  <p className="font-semibold text-ink-900">{c.instructor ?? "Instructor"}</p>
                  <p className="text-[11px] text-ink-500">Course Instructor</p>
                </div>
                <div className="border-t-2 border-ink-300 pt-2">
                  <p className="font-semibold text-ink-900">{new Date(c.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                  <p className="text-[11px] text-ink-500">Date of Issue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 rounded-full bg-go-500/15 px-4 py-2 text-sm font-semibold text-go-300">
            <BadgeCheck className="size-4" /> Verified genuine · Code {c.code}
          </div>
          <div className="flex gap-2">
            <PrintButton />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          This certificate was issued automatically by the Sri Mathru automation engine and verified against the school&apos;s records.
        </p>
      </div>
    </div>
  );
}
