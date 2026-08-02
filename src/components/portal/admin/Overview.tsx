"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Clock, CreditCard, IndianRupee, Layers, Lightbulb, Receipt, Share2, Star, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { Avatar, Badge, Card, ProgressBar } from "@/components/ui";
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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
            <TrendingUp className="size-4 text-go-600" /> Profit trend (6 months)
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.profitTrend ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8b98a5" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} tickFormatter={(v: ApiData) => `${(v as number) / 1000}k`} />
                <Tooltip formatter={(v: ApiData) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Trophy className="size-4 text-amber-500" /> Instructor leaderboard
          </h3>
          <div className="mt-4 space-y-3">
            {[...(a.instructors ?? [])]
              .sort((x: ApiData, y: ApiData) => Number(y.rating) - Number(x.rating))
              .map((i: ApiData, idx: number) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand-600">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">{i.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-ink-400">
                      <Star className="size-3 fill-amber-400 text-amber-400" /> {Number(i.rating).toFixed(1)} · {i.reviewCount} reviews
                    </p>
                  </div>
                  <Badge tone="green">{i.activeToday} today</Badge>
                </div>
              ))}
            {(a.instructors ?? []).length === 0 && <p className="text-sm text-ink-400">No instructors yet.</p>}
          </div>
        </Card>
      </div>

      <div className="border-t border-ink-100 pt-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-brand-500" />
          <h2 className="font-display text-xl font-bold text-ink-900">Analytics deep dive</h2>
          <Badge tone="brand">Beta</Badge>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <TrendingUp className="size-4 text-go-600" /> Month-end forecast
            </h3>
            <p className="mt-3 font-display text-3xl font-bold text-ink-900">{formatINR(a.forecast.projectedMonthEnd)}</p>
            <p className="text-xs font-medium text-ink-500">projected revenue</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>{formatINR(a.forecast.revenueSoFar)} collected</span>
                <span>{Math.round((a.forecast.revenueSoFar / Math.max(1, a.forecast.projectedMonthEnd)) * 100)}%</span>
              </div>
              <ProgressBar value={(a.forecast.revenueSoFar / Math.max(1, a.forecast.projectedMonthEnd)) * 100} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-ink-50 p-2.5">
                <p className="font-display text-sm font-bold text-ink-900">{formatINR(a.forecast.avgDaily)}</p>
                <p className="text-[10px] text-ink-400">Avg / day</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-2.5">
                <p className="font-display text-sm font-bold text-go-600">{formatINR(a.forecast.projectedProfit)}</p>
                <p className="text-[10px] text-ink-400">Projected profit</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-ink-400">Projection from the last 7-day average across {a.forecast.remainingDays} remaining day(s).</p>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <Clock className="size-4 text-brand-500" /> When students book (28 days)
            </h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.hourlyDemand} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8b98a5" }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(20,199,183,0.06)" }} contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                  <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]} fill="#28c7b7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <Layers className="size-4 text-violet-500" /> Lead funnel
            </h3>
            <div className="mt-4 space-y-3">
              {a.leadFunnel.map((f: ApiData) => (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-600">{f.stage}</span>
                    <span className="text-ink-400">{f.count} · {f.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={cn("h-full rounded-full", f.stage === "Won" ? "bg-gradient-to-r from-go-400 to-go-600" : f.stage === "Lost" ? "bg-red-400" : "bg-brand-400")}
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              {a.leadFunnel.every((f: ApiData) => f.count === 0) && <p className="text-sm text-ink-400">No leads yet.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <CreditCard className="size-4 text-amber-500" /> Payment methods
            </h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={a.paymentMethods} dataKey="count" nameKey="name" innerRadius={40} outerRadius={68} paddingAngle={3}>
                      {a.paymentMethods.map((_: ApiData, i: number) => (
                        <Cell key={i} fill={["#14b8a6", "#7c3aed", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899"][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {a.paymentMethods.map((m: ApiData, i: number) => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink-600">
                      <span className="size-2 rounded-full" style={{ background: ["#14b8a6", "#7c3aed", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899"][i % 6] }} />
                      {m.name}
                    </span>
                    <span className="font-semibold text-ink-800">{m.count} · {formatINR(m.amount)}</span>
                  </div>
                ))}
                {a.paymentMethods.length === 0 && <p className="text-sm text-ink-400">No paid payments yet.</p>}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <Receipt className="size-4 text-red-400" /> Expenses this month
            </h3>
            <div className="mt-4 space-y-3">
              {a.expensesByCategory.map((e: ApiData) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <span className="text-ink-600">{e.name}</span>
                  <span className="font-semibold text-ink-800">{formatINR(e.amount)}</span>
                </div>
              ))}
              {a.expensesByCategory.length === 0 && <p className="text-sm text-ink-400">No expenses recorded this month.</p>}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <CalendarDays className="size-4 text-brand-500" /> Coming week load
            </h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.weekPipeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b98a5" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8b98a5" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eceff1", fontSize: 12 }} />
                  <Bar dataKey="count" name="Lessons" radius={[6, 6, 0, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
              <Share2 className="size-4 text-go-600" /> Referrals
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="font-display text-xl font-bold text-ink-900">{a.referrals.referredCount}</p>
                <p className="text-[10px] text-ink-400">Referred students</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="font-display text-xl font-bold text-go-600">{formatINR(a.referrals.referralRevenue)}</p>
                <p className="text-[10px] text-ink-400">Revenue</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {a.referrals.topCodes.map((c: ApiData) => (
                <div key={c.code} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-xs">
                  <Badge tone="ink">{c.code}</Badge>
                  <span className="font-semibold text-ink-700">{c.count} student{c.count > 1 ? "s" : ""}</span>
                </div>
              ))}
              {a.referrals.topCodes.length === 0 && <p className="text-sm text-ink-400">No referrals yet.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
