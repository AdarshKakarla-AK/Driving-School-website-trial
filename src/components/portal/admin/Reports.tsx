"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, FileSpreadsheet, FileText, IndianRupee, TrendingUp, Trophy, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn, formatINR } from "@/lib/utils";
import { api, type ApiData } from "@/lib/client";

interface Metric {
  key: string;
  label: string;
  thisWeek: number;
  lastWeek: number;
  delta: number | null;
  suffix?: string;
}

interface WeeklyPayload {
  report: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
    metrics: Metric[];
    revenueByDay: { date: string; label: string; revenue: number }[];
    topInstructor: { name: string; lessons: number } | null;
    pipelineNext7: number;
  };
}

function fmtValue(n: number, suffix?: string): string {
  if (suffix === "INR") return formatINR(n);
  if (suffix === "%") return `${n}%`;
  return String(n);
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs font-semibold text-ink-400">—</span>;
  const up = delta >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", up ? "text-go-600" : "text-stop-500")}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {delta > 0 ? "+" : ""}{delta}%
    </span>
  );
}

export function AdminReports() {
  const [report, setReport] = React.useState<WeeklyPayload["report"] | null>(null);
  const [loadedFor, setLoadedFor] = React.useState(-1);
  const [offset, setOffset] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const loading = report === null || loadedFor !== offset;

  React.useEffect(() => {
    let mounted = true;
    api<WeeklyPayload>(`/api/admin/reports/weekly?offset=${offset}`)
      .then((d) => {
        if (mounted) {
          setReport(d.report);
          setLoadedFor(offset);
          setError(null);
        }
      })
      .catch((e: ApiData) => {
        if (mounted) setError(e.message ?? "Could not load report");
      });
    return () => {
      mounted = false;
    };
  }, [offset]);

  const kpi = (key: string) => report?.metrics.find((m) => m.key === key);
  const revenue = kpi("revenue");
  const bookings = kpi("bookings");
  const lessons = kpi("lessons");
  const attendance = kpi("attendance");

  const cardTone = "flex size-9 items-center justify-center rounded-xl";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Weekly report</h1>
          <p className="mt-1 text-sm text-ink-500">
            {report ? `${report.current.start} to ${report.current.end} · vs ${report.previous.start}–${report.previous.end}` : "Week-over-week performance"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-ink-200 bg-card p-0.5">
            {[
              { v: 0, label: "This week" },
              { v: 1, label: "Last week" },
              { v: 2, label: "2 weeks ago" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setOffset(o.v)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  offset === o.v ? "bg-brand-500 text-white" : "text-ink-500 hover:text-ink-800"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <a
            href={`/api/admin/reports/weekly?offset=${offset}&format=csv`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-card px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-go-500/40 hover:text-go-600"
          >
            <FileSpreadsheet className="size-4" /> CSV
          </a>
          <a
            href={`/api/admin/reports/weekly?offset=${offset}&format=pdf`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-card px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-brand-500/40 hover:text-brand-600"
          >
            <FileText className="size-4" /> PDF
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-stop-500/20 bg-stop-500/5 p-4 text-sm text-stop-600">{error}</div>
      )}
      {loading && <p className="text-sm text-ink-400">Loading weekly report…</p>}

      {!loading && report && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Card className="p-4">
              <div className={cn(cardTone, "text-go-600 bg-go-500/10")}>
                <IndianRupee className="size-4.5" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink-900">{revenue ? fmtValue(revenue.thisWeek, revenue.suffix) : "—"}</p>
              <p className="text-xs font-medium text-ink-500">Revenue</p>
              <div className="mt-1"><Delta delta={revenue?.delta ?? null} /></div>
            </Card>
            <Card className="p-4">
              <div className={cn(cardTone, "text-brand-600 bg-brand-500/10")}>
                <CalendarDays className="size-4.5" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink-900">{bookings ? bookings.thisWeek : "—"}</p>
              <p className="text-xs font-medium text-ink-500">Bookings</p>
              <div className="mt-1"><Delta delta={bookings?.delta ?? null} /></div>
            </Card>
            <Card className="p-4">
              <div className={cn(cardTone, "text-amber-600 bg-amber-500/10")}>
                <TrendingUp className="size-4.5" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink-900">{lessons ? lessons.thisWeek : "—"}</p>
              <p className="text-xs font-medium text-ink-500">Lessons completed</p>
              <div className="mt-1"><Delta delta={lessons?.delta ?? null} /></div>
            </Card>
            <Card className="p-4">
              <div className={cn(cardTone, "text-violet-600 bg-violet-500/10")}>
                <Users className="size-4.5" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink-900">{attendance ? fmtValue(attendance.thisWeek, attendance.suffix) : "—"}</p>
              <p className="text-xs font-medium text-ink-500">Attendance rate</p>
              <div className="mt-1"><Delta delta={attendance?.delta ?? null} /></div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-2">
              <h3 className="font-display font-bold text-ink-900">Daily revenue (this & last week)</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.revenueByDay} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8b98a5" }} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} tickFormatter={(v: ApiData) => `${(v as number) / 1000}k`} />
                    <Tooltip formatter={(v: ApiData) => formatINR(v as number)} labelFormatter={(l: ApiData) => l} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-900">Highlights</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-ink-50 p-4">
                  <div className={cn(cardTone, "size-8 text-amber-600 bg-amber-500/10")}>
                    <Trophy className="size-4" />
                  </div>
                  <p className="mt-2 font-display text-lg font-bold text-ink-900">
                    {report.topInstructor ? report.topInstructor.name : "—"}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    Top instructor · {report.topInstructor ? `${report.topInstructor.lessons} lessons` : "no lessons yet"}
                  </p>
                </div>
                <div className="rounded-2xl bg-ink-50 p-4">
                  <div className={cn(cardTone, "size-8 text-go-600 bg-go-500/10")}>
                    <Download className="size-4" />
                  </div>
                  <p className="mt-2 font-display text-lg font-bold text-ink-900">{report.pipelineNext7}</p>
                  <p className="text-[11px] text-ink-400">Lessons in the next 7 days</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-900">All metrics</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wide text-ink-400">
                    <th className="pb-2 pr-4 font-semibold">Metric</th>
                    <th className="pb-2 pr-4 font-semibold">This week</th>
                    <th className="pb-2 pr-4 font-semibold">Last week</th>
                    <th className="pb-2 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {report.metrics.map((m) => (
                    <tr key={m.key} className="border-b border-ink-50">
                      <td className="py-2.5 pr-4 font-medium text-ink-700">{m.label}</td>
                      <td className="py-2.5 pr-4 font-semibold text-ink-900">{fmtValue(m.thisWeek, m.suffix)}</td>
                      <td className="py-2.5 pr-4 text-ink-500">{fmtValue(m.lastWeek, m.suffix)}</td>
                      <td className="py-2.5"><Delta delta={m.delta} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="brand">{report.revenueByDay.length} days</Badge>
              <Badge tone="ink">ISO week</Badge>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
