"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, IndianRupee, Layers, TrendingUp, Users, Zap } from "lucide-react";
import { Avatar, Badge, Card } from "@/components/ui";
import { cn, formatINR } from "@/lib/utils";
import type { ApiData } from "@/lib/client";

export function AdminOverview({ data }: { data: ApiData }) {
  const a = data.analytics;
  const kpis = [
    { label: "Revenue this month", value: formatINR(a.revenueMonth), sub: `${formatINR(a.revenueToday)} today`, icon: IndianRupee, tone: "text-go-600 bg-go-500/10" },
    { label: "Active students", value: String(a.activeStudents), sub: `${a.enrolledCount} total enrolled`, icon: Users, tone: "text-brand-600 bg-brand-500/10" },
    { label: "Lessons today", value: String(a.todayBookings), sub: `Attendance ${a.attendanceRate}%`, icon: CalendarDays, tone: "text-amber-600 bg-amber-500/10" },
    { label: "Vehicle utilisation", value: `${a.vehicleUtilization}%`, sub: `Profit ${formatINR(a.profit)}`, icon: TrendingUp, tone: "text-violet-600 bg-violet-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back, {data.admin?.name?.split(" ")[0] ?? "Admin"} 👋</h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s how your driving school is performing today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className={cn("flex size-9 items-center justify-center rounded-xl", k.tone)}>
              <k.icon className="size-4.5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-ink-900">{k.value}</p>
            <p className="text-xs font-medium text-ink-500">{k.label}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">{k.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-ink-900">Revenue (last 30 days)</h3>
            <Badge tone="green">₹{a.monthlyGrowth[a.monthlyGrowth.length - 1]?.revenue.toLocaleString("en-IN")}</Badge>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.monthlyGrowth} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#28c7b7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#28c7b7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} tick={{ fontSize: 10, fill: "#8b98a5" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: ApiData) => formatINR(v)} labelFormatter={(l) => l} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Package revenue</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={a.revenueByPackage} dataKey="amount" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {a.revenueByPackage.map((_: ApiData, i: number) => (
                    <Cell key={i} fill={["#14b8a6", "#f59e0b", "#7c3aed", "#3b82f6", "#ef4444", "#ec4899"][i % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: ApiData) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {a.revenueByPackage.map((p: ApiData, i: number) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-600">
                  <span className="size-2 rounded-full" style={{ background: ["#14b8a6", "#f59e0b", "#7c3aed", "#3b82f6", "#ef4444", "#ec4899"][i % 6] }} />
                  {p.name}
                </span>
                <span className="font-semibold text-ink-800">{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Recent bookings</h3>
          <div className="mt-3 space-y-2.5">
            {data.recentBookings.map((b: ApiData) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5">
                <Avatar name={b.student ?? "S"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{b.student}</p>
                  <p className="text-[11px] text-ink-400">{b.package}</p>
                </div>
                <Badge tone={b.status === "pending_payment" ? "amber" : b.status === "cancelled" ? "red" : "blue"} className="capitalize">{b.status.replace("_", " ")}</Badge>
              </div>
            ))}
            {data.recentBookings.length === 0 && <p className="text-sm text-ink-400">No bookings yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">New leads</h3>
          <div className="mt-3 space-y-2.5">
            {data.recentLeads.map((l: ApiData) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5">
                <Avatar name={l.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{l.name}</p>
                  <p className="text-[11px] text-ink-400">{l.phone} · {l.source}</p>
                </div>
                <Badge tone="amber" className="capitalize">{l.status}</Badge>
              </div>
            ))}
            {data.recentLeads.length === 0 && <p className="text-sm text-ink-400">No leads yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Zap className="size-4 text-brand-500" /> Automation log
          </h3>
          <div className="mt-3 space-y-2">
            {data.automationLogs.slice(0, 8).map((l: ApiData) => (
              <div key={l.id} className="flex items-start gap-2.5 rounded-xl bg-ink-50 p-2.5 text-xs">
                <div className="flex flex-col items-center pt-0.5">
                  <span className={cn("size-1.5 rounded-full", l.channel === "whatsapp" ? "bg-go-500" : l.channel === "app" ? "bg-brand-500" : "bg-amber-500")} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-800">{l.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-ink-400">{l.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Performance</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Lead conversion", value: `${a.conversion}%`, icon: Layers },
              { label: "Cancellation rate", value: `${a.cancellationRate}%`, icon: Layers },
              { label: "Retention", value: `${a.retention}%`, icon: Users },
              { label: "Avg lessons/student", value: String(a.avgLessons), icon: CalendarDays },
              { label: "Completed lessons", value: String(a.completedLessons), icon: CalendarDays },
              { label: "Upcoming lessons", value: String(a.upcomingLessons), icon: CalendarDays },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-ink-50 p-3 text-center">
                <p className="font-display text-lg font-bold text-ink-900">{s.value}</p>
                <p className="text-[11px] text-ink-400">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Lead sources</h3>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.leadSources} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b98a5" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]} fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
