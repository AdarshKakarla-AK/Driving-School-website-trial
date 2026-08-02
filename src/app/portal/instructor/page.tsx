"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CarFront, CheckCircle2, ChevronLeft, ChevronRight, Phone, Send, Star, Wallet, XCircle, Clock3 } from "lucide-react";
import { Avatar, Badge, Button, Card, Input, Modal, Tabs, Textarea } from "@/components/ui";
import { useDashboard } from "@/components/portal/useDashboard";
import { PortalSkeleton, PortalError } from "@/components/portal/states";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn, dayLabel, formatINR, formatTime, greeting } from "@/lib/utils";
import type { LessonNote } from "@/lib/db/types";

export default function InstructorPortal() {
  return (
    <React.Suspense fallback={null}>
      <InstructorPortalInner />
    </React.Suspense>
  );
}

function InstructorPortalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "today";
  const { data, loading, error, refresh } = useDashboard();
  const toast = useToast();

  const setTab = (t: string) => router.replace(`/portal/instructor${t === "today" ? "" : `?tab=${t}`}`);

  const mark = async (bookingId: string, attendance: string) => {
    try {
      const res = await api<{ certificate?: string }>("/api/attendance", { method: "POST", body: JSON.stringify({ bookingId, attendance }) });
      toast.push(`Marked ${attendance} ✅`);
      if (res.certificate) toast.push("Student completed the course — certificate issued! 🎓");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  if (loading) return <PortalSkeleton />;
  if (error || !data) return <PortalError onRetry={refresh} />;

  const TABS = [
    { id: "today", label: `Today (${data.today?.length ?? 0})` },
    { id: "schedule", label: "Schedule" },
    { id: "upcoming", label: "Upcoming" },
    { id: "students", label: "My Students" },
    { id: "earnings", label: "Earnings" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            {greeting()}, {data.profile.name.split(" ")[0]}! 🚗
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <Star className="size-4 text-brand-500" fill="currentColor" /> {data.profile.rating?.toFixed(1)} · {data.profile.reviewCount} reviews · {data.profile.yearsExp} yrs experience
          </p>
        </div>
        <div className="flex gap-2">
          <div className="card-shadow flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm">
            <Wallet className="size-4 text-go-600" />
            <span className="font-bold text-ink-900">{formatINR(data.earnings)}</span>
            <span className="text-xs text-ink-400">this month</span>
          </div>
          <div className="card-shadow flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm">
            <Clock3 className="size-4 text-brand-500" />
            <span className="font-bold text-ink-900">{data.lessonsThisMonth}</span>
            <span className="text-xs text-ink-400">lessons</span>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "today" && (
        <TodayView data={data} onMark={mark} refresh={refresh} />
      )}
      {tab === "schedule" && <ScheduleView schedule={data.schedule ?? []} />}
      {tab === "upcoming" && (
        <div className="space-y-3">
          {data.upcoming.map((b: ApiData) => (
            <Card key={b.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar name={b.student ?? "S"} size="md" />
                <div>
                  <p className="font-semibold text-ink-900">{b.student}</p>
                  <p className="text-xs text-ink-500">{b.package}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-ink-800">{dayLabel(b.date)}</p>
                <p className="text-xs text-ink-400">{formatTime(b.time)} · {b.vehicle}</p>
              </div>
            </Card>
          ))}
          {data.upcoming.length === 0 && <Card className="p-8 text-center text-sm text-ink-400">No upcoming lessons.</Card>}
        </div>
      )}
      {tab === "students" && <StudentsView students={data.students} />}
      {tab === "earnings" && <EarningsView data={data} />}
    </div>
  );
}

function TodayView({ data, onMark, refresh }: { data: ApiData; onMark: (id: string, a: string) => void; refresh: () => void }) {
  const [noteFor, setNoteFor] = React.useState<ApiData | null>(null);
  const toast = useToast();

  const saveNote = async (n: Partial<LessonNote>) => {
    await api("/api/notes", { method: "POST", body: JSON.stringify({ bookingId: noteFor.id, ...n }) });
    toast.push("Note saved — student notified 💬");
    setNoteFor(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      {data.today.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-400">You&apos;re free today! Enjoy the day off 🎉</Card>
      ) : (
        data.today.map((b: ApiData) => {
          const done = b.status === "completed";
          return (
            <Card key={b.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <span className="font-display text-lg font-bold leading-none">{formatTime(b.time).split(" ")[0]}</span>
                    <span className="text-[10px] font-semibold uppercase">{formatTime(b.time).split(" ")[1]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-ink-900">{b.student}</p>
                      <Badge tone={done ? "green" : "blue"} className="capitalize">{done ? b.attendance : "upcoming"}</Badge>
                    </div>
                    <p className="text-xs text-ink-500">{b.package} · {b.vehicle}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-500">
                      <a href={`tel:${b.studentPhone}`} className="inline-flex items-center gap-1 font-semibold text-go-600 hover:underline">
                        <Phone className="size-3.5" /> {b.studentPhone}
                      </a>
                    </div>
                  </div>
                </div>

                {!done ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="success" onClick={() => onMark(b.id, "present")}>
                      <CheckCircle2 className="size-3.5" /> Present
                    </Button>
                    <Button size="sm" variant="outline" className="text-brand-600" onClick={() => onMark(b.id, "late")}>
                      <Clock3 className="size-3.5" /> Late
                    </Button>
                    <Button size="sm" variant="ghost" className="text-stop-500" onClick={() => onMark(b.id, "absent")}>
                      <XCircle className="size-3.5" /> Absent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNoteFor(b)}>
                      <Send className="size-3.5" /> Add note
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setNoteFor(b)}>
                    <Send className="size-3.5" /> Add note
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}

      <Modal open={!!noteFor} onClose={() => setNoteFor(null)} title={`Lesson note for ${noteFor?.student ?? ""}`}>
        {noteFor && <NoteForm onSave={saveNote} />}
      </Modal>
    </div>
  );
}

function NoteForm({ onSave }: { onSave: (n: ApiData) => void }) {
  const [note, setNote] = React.useState("");
  const [recommendation, setRecommendation] = React.useState("");
  const [skills, setSkills] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const skillDeltas: Record<string, number> = {};
    Object.entries(skills).forEach(([k, v]) => {
      if (v) skillDeltas[k] = 0.5;
    });
    await onSave({ note, recommendation, skillDeltas });
  };

  const SKILLS = ["steering", "parking", "reverse", "traffic", "hillStart", "highway", "nightDriving"];
  const LABELS: Record<string, string> = { steering: "Steering", parking: "Parking", reverse: "Reverse", traffic: "Traffic", hillStart: "Hill start", highway: "Highway", nightDriving: "Night" };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Textarea label="What happened in today's lesson?" rows={3} required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Good clutch control today. Needs more practice on turns." />
      <Input label="Recommended next focus" value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. Reverse parking drill" />
      <div>
        <p className="mb-2 text-sm font-medium text-ink-700">Skills improved today</p>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSkills((x) => ({ ...x, [s]: !x[s] }))}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", skills[s] ? "border-go-500 bg-go-500 text-white" : "border-ink-200 bg-card text-ink-600")}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" loading={busy} className="w-full">
        Save note & notify student
      </Button>
    </form>
  );
}

function StudentsView({ students }: { students: ApiData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s: ApiData) => (
        <Card key={s.id} className="p-5">
          <div className="flex items-center gap-3">
            <Avatar name={s.name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{s.name}</p>
              <p className="text-xs text-ink-400">{s.studentId}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-ink-500">
            <p className="flex items-center gap-1.5">
              <Phone className="size-3.5 text-brand-500" /> {s.phone}
            </p>
            {s.nextLesson ? (
              <p className="flex items-center gap-1.5">
                <CarFront className="size-3.5 text-go-600" /> Next: {dayLabel(s.nextLesson.date)} {formatTime(s.nextLesson.time)}
              </p>
            ) : (
              <p className="text-ink-400">No upcoming lesson</p>
            )}
          </div>
        </Card>
      ))}
      {students.length === 0 && <Card className="p-8 text-center text-sm text-ink-400">No active students yet.</Card>}
    </div>
  );
}

function ScheduleView({ schedule }: { schedule: ApiData[] }) {
  const [cursor, setCursor] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = React.useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const byDate = React.useMemo(() => {
    const m = new Map<string, ApiData[]>();
    schedule.forEach((b: ApiData) => {
      const list = m.get(b.date) ?? [];
      list.push(b);
      m.set(b.date, list);
    });
    m.forEach((list) => list.sort((a: ApiData, b: ApiData) => a.time.localeCompare(b.time)));
    return m;
  }, [schedule]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = new Date(year, month, 1).getDay();
  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const cells: (number | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selectedLessons = selected ? (byDate.get(selected) ?? []) : [];
  const dateOf = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="p-5 lg:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
            <CalendarDays className="size-4 text-brand-500" /> {monthLabel}
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`pad-${i}`} />;
            const date = dateOf(day);
            const lessons = byDate.get(date) ?? [];
            const isToday = date === today;
            const isSelected = date === selected;
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition",
                  isSelected
                    ? "border-brand-500 bg-brand-500 text-white"
                    : isToday
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : lessons.length > 0
                        ? "border-ink-200 bg-card font-semibold text-ink-800 hover:border-brand-300"
                        : "border-transparent hover:bg-ink-50"
                )}
              >
                <span>{day}</span>
                {lessons.length > 0 && (
                  <span className={cn("text-[10px] font-bold", isSelected ? "text-white/80" : "text-go-600")}>
                    {lessons.length} lesson{lessons.length > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h3 className="font-display font-bold text-ink-900">
          {selected ? new Date(selected + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : "Pick a day"}
        </h3>
        <div className="mt-3 space-y-2.5">
          {selectedLessons.map((b: ApiData) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
              <div>
                <p className="text-sm font-semibold text-ink-800">{formatTime(b.time)}</p>
                <p className="text-xs text-ink-500">{b.student}{b.package ? ` · ${b.package}` : ""}</p>
              </div>
              <Badge tone={b.status === "completed" ? "green" : b.status === "confirmed" || b.status === "upcoming" ? "blue" : "amber"} className="capitalize">{b.status.replace("_", " ")}</Badge>
            </div>
          ))}
          {selected && selectedLessons.length === 0 && <p className="text-sm text-ink-400">No lessons on this day.</p>}
          {!selected && <p className="text-sm text-ink-400">Select a day to see its lessons.</p>}
        </div>
      </Card>
    </div>
  );
}

function EarningsView({ data }: { data: ApiData }) {
  const att = data.attendance ?? {};
  const total = Object.values(att).reduce((a: ApiData, b: ApiData) => a + b, 0) as number;
  const base = Number(data.earningsBase ?? 0);
  const commission = Number(data.commissionThisMonth ?? 0);
  const pct = Number(data.commissionPct ?? 0);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <h3 className="font-display font-bold text-ink-900">This month</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            { label: "Lessons", value: String(data.lessonsThisMonth) },
            { label: "Attendance rate", value: total ? `${Math.round(((att.present ?? 0) / total) * 100)}%` : "—" },
            { label: "Base pay", value: formatINR(base) },
            { label: "Commission", value: formatINR(commission) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-ink-50 p-4">
              <p className="font-display text-xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-go-500/10 p-4">
          <span className="font-semibold text-ink-800">Total earnings</span>
          <span className="font-display text-2xl font-bold text-go-600">{formatINR(base + commission)}</span>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          {data.lessonsThisMonth} lessons × {formatINR(data.salaryPerLesson ?? 500)} + {pct}% commission on captured package payments this month. Payroll runs on the 1st of every month.
        </p>

        <h4 className="mt-6 font-display font-bold text-ink-900">Earnings trend (6 months)</h4>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.earningsTrend ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8b98a5" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} tickFormatter={(v: ApiData) => `${(v as number) / 1000}k`} />
              <Tooltip formatter={(v: ApiData) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="base" name="Base" stackId="e" fill="#14b8a6" />
              <Bar dataKey="commission" name="Commission" stackId="e" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Payroll history</h3>
          <div className="mt-3 space-y-2.5">
            {(data.payroll ?? []).map((p: ApiData) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{p.month}</p>
                  <p className="text-xs text-ink-400">{p.lessons} lessons · {formatINR(p.base)} base</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink-900">{formatINR(p.total)}</p>
                  <Badge tone={p.status === "paid" ? "green" : "amber"} className="capitalize">{p.status}</Badge>
                </div>
              </div>
            ))}
            {(data.payroll ?? []).length === 0 && <p className="text-sm text-ink-400">No payroll runs yet. The admin processes payouts every month.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Recent notes</h3>
          <div className="mt-3 space-y-3">
            {data.recentNotes.slice(0, 5).map((n: ApiData) => (
              <div key={n.id} className="rounded-xl bg-ink-50 p-3 text-xs">
                <p className="font-semibold text-ink-800">{new Date(n.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                <p className="mt-1 text-ink-500">&quot;{n.note}&quot;</p>
              </div>
            ))}
            {data.recentNotes.length === 0 && <p className="text-sm text-ink-400">No notes yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
