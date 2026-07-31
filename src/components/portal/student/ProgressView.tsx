"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Check, ClipboardCheck, Sparkles } from "lucide-react";
import { Card, ProgressBar, Stars } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn } from "@/lib/utils";
import { SKILL_LABELS } from "@/lib/db/seed";

const CHECKLIST: { key: string; label: string; hint: string }[] = [
  { key: "learnerLicense", label: "Learner's License", hint: "Approved by RTO" },
  { key: "eyeTest", label: "Eye Test", hint: "Done at RTO center" },
  { key: "practiceHours", label: "Practice Hours", hint: "Tracked automatically" },
  { key: "mockTest", label: "Mock Test", hint: "Ready for the real thing" },
  { key: "rtoSlot", label: "RTO Slot", hint: "Test appointment booked" },
  { key: "drivingTest", label: "Driving Test", hint: "Passed the test" },
  { key: "licenseIssued", label: "License Issued", hint: "License in hand 🎉" },
];

export function ProgressView({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const prog = data.progress;
  if (!prog) return <Card className="p-8 text-center text-sm text-ink-400">No progress data yet. Complete your first lesson to get started.</Card>;

  const skills = Object.entries(prog.skills).filter(([k]) => SKILL_LABELS[k]);

  const chartData = skills.length
    ? skills.map(([k, s]: ApiData) => ({ name: SKILL_LABELS[k]?.split(" ")[0], value: s.value }))
    : [{ name: "Steering", value: 1 }];

  const toggle = async (key: string, value: boolean) => {
    await api("/api/progress", { method: "PATCH", body: JSON.stringify({ key, value }) });
    toast.push("License checklist updated ✅");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Progress & skills</h1>
        <p className="text-sm text-ink-500">Updated automatically after every lesson with your instructor&apos;s feedback.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Skill ratings</h3>
          <div className="mt-4 space-y-4">
            {skills.map(([key, s]: ApiData) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-700">{SKILL_LABELS[key]}</span>
                  <Stars rating={s.value} size={14} />
                </div>
                <ProgressBar value={(s.value / 5) * 100} />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-ink-100 bg-paper p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Lesson completion</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink-800">
                {prog.lessonsCompleted} of {prog.lessonsTotal} lessons
              </span>
              <span className="font-bold text-brand-600">{prog.lessonsTotal ? Math.round((prog.lessonsCompleted / prog.lessonsTotal) * 100) : 0}%</span>
            </div>
            <ProgressBar className="mt-2" value={prog.lessonsTotal ? (prog.lessonsCompleted / prog.lessonsTotal) * 100 : 0} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Skill trend</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display font-bold text-ink-900">License preparation checklist</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHECKLIST.map((c) => {
            const done = !!prog.licenseChecklist?.[c.key];
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key, !done)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition",
                  done ? "border-go-500/30 bg-go-500/5" : "border-ink-200 bg-white hover:border-brand-300"
                )}
              >
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", done ? "bg-go-500 text-white" : "border-2 border-ink-200")}>
                  {done && <Check className="size-4" />}
                </span>
                <span>
                  <span className={cn("block text-sm font-semibold", done ? "text-go-700" : "text-ink-800")}>{c.label}</span>
                  <span className="block text-xs text-ink-400">{c.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display flex items-center gap-2 font-bold text-ink-900">
          <ClipboardCheck className="size-5 text-brand-500" /> Instructor feedback
        </h3>
        <div className="mt-4 space-y-4">
          {data.notes.slice(0, 8).map((n: ApiData) => (
            <div key={n.id} className="rounded-2xl border border-ink-100 p-4">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>{new Date(n.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="font-semibold uppercase tracking-wider">Lesson feedback</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">&quot;{n.note}&quot;</p>
              {n.recommendation && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                  <Sparkles className="size-3.5" /> Recommended next: {n.recommendation}
                </p>
              )}
            </div>
          ))}
          {data.notes.length === 0 && <p className="text-sm text-ink-400">No feedback yet.</p>}
        </div>
      </Card>
    </div>
  );
}
