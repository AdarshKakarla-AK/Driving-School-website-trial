import "server-only";
import type { DB } from "./db/types";

export interface WeekRange {
  start: string;
  end: string;
}

// ISO week (Mon–Sun) as UTC date strings. offsetWeeks 0 = the current week,
// 1 = the week that just ended, etc.
export function weekRange(offsetWeeks = 0, nowDate: Date = new Date()): WeekRange {
  const now = nowDate;
  const sinceMonday = (now.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - sinceMonday - offsetWeeks * 7));
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(monday), end: iso(sunday) };
}

function inRange(date: string, r: WeekRange): boolean {
  return date >= r.start && date <= r.end;
}

export interface WeeklyMetric {
  key: string;
  label: string;
  thisWeek: number;
  lastWeek: number;
  delta: number | null;
  suffix?: string;
}

export function pctDelta(thisWeek: number, lastWeek: number): number | null {
  if (lastWeek === 0) return thisWeek > 0 ? 100 : null;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

export interface WeeklyReport {
  current: WeekRange;
  previous: WeekRange;
  metrics: WeeklyMetric[];
  revenueByDay: { date: string; label: string; revenue: number }[];
  topInstructor: { name: string; lessons: number } | null;
  pipelineNext7: number;
}

export function weeklyReport(db: DB, offsetWeeks = 0, nowDate: Date = new Date()): WeeklyReport {
  const current = weekRange(offsetWeeks, nowDate);
  const previous = weekRange(offsetWeeks + 1, nowDate);

  const sum = (arr: { paidAmount?: number }[]) => arr.reduce((a, p) => a + (p.paidAmount ?? 0), 0);

  const revenueCurrent = sum(db.payments.filter((p) => p.status === "paid" && inRange(p.createdAt.slice(0, 10), current)));
  const revenuePrev = sum(db.payments.filter((p) => p.status === "paid" && inRange(p.createdAt.slice(0, 10), previous)));

  const leadWon = ["registered", "active", "completed"];
  const newLeadsCurrent = db.leads.filter((l) => inRange(l.createdAt.slice(0, 10), current)).length;
  const newLeadsPrev = db.leads.filter((l) => inRange(l.createdAt.slice(0, 10), previous)).length;
  const convertedCurrent = db.leads.filter((l) => leadWon.includes(l.status) && inRange(l.createdAt.slice(0, 10), current)).length;
  const convertedPrev = db.leads.filter((l) => leadWon.includes(l.status) && inRange(l.createdAt.slice(0, 10), previous)).length;

  const newStudentsCurrent = db.users.filter((u) => u.role === "student" && inRange(u.createdAt.slice(0, 10), current)).length;
  const newStudentsPrev = db.users.filter((u) => u.role === "student" && inRange(u.createdAt.slice(0, 10), previous)).length;

  const completedCurrent = db.bookings.filter((b) => b.status === "completed" && inRange(b.date, current));
  const completedPrev = db.bookings.filter((b) => b.status === "completed" && inRange(b.date, previous));
  const attended = (bs: DB["bookings"]) => bs.filter((b) => b.attendance !== "absent").length;
  const attendanceCurrent = completedCurrent.length ? Math.round((attended(completedCurrent) / completedCurrent.length) * 100) : 0;
  const attendancePrev = completedPrev.length ? Math.round((attended(completedPrev) / completedPrev.length) * 100) : 0;

  const cancelledCurrent = db.bookings.filter((b) => b.status === "cancelled" && inRange(b.date, current)).length;
  const cancelledPrev = db.bookings.filter((b) => b.status === "cancelled" && inRange(b.date, previous)).length;
  const noShowCurrent = db.bookings.filter((b) => b.status === "no_show" && inRange(b.date, current)).length;
  const noShowPrev = db.bookings.filter((b) => b.status === "no_show" && inRange(b.date, previous)).length;

  const bookedCurrent = db.bookings.filter((b) => inRange(b.date, current) && b.status !== "cancelled" && b.status !== "no_show").length;
  const bookedPrev = db.bookings.filter((b) => inRange(b.date, previous) && b.status !== "cancelled" && b.status !== "no_show").length;

  const top = new Map<string, number>();
  completedCurrent.forEach((b) => top.set(b.instructorId, (top.get(b.instructorId) ?? 0) + 1));
  const topEntry = [...top.entries()].sort((a, b) => b[1] - a[1])[0];
  const topInstructor = topEntry
    ? { name: db.users.find((u) => u.id === topEntry[0])?.name ?? "Unknown", lessons: topEntry[1] }
    : null;

  const todayIso = nowDate.toISOString().slice(0, 10);
  const tomorrow = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() + 1));
  const horizon = new Date(tomorrow.getTime() + 6 * 86400000).toISOString().slice(0, 10);
  const pipelineNext7 = db.bookings.filter((b) => b.date >= todayIso && b.date <= horizon && b.status !== "cancelled" && b.status !== "no_show").length;

  const revenueByDay: WeeklyReport["revenueByDay"] = [];
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.parse(`${previous.start}T00:00:00Z`) + (13 - i) * 86400000).toISOString().slice(0, 10);
    days.push(date);
  }
  days.forEach((date) => {
    const revenue = sum(db.payments.filter((p) => p.status === "paid" && p.createdAt.slice(0, 10) === date));
    revenueByDay.push({
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short" }),
      revenue,
    });
  });

  const metrics: WeeklyMetric[] = [
    { key: "revenue", label: "Revenue", thisWeek: revenueCurrent, lastWeek: revenuePrev, delta: pctDelta(revenueCurrent, revenuePrev), suffix: "INR" },
    { key: "bookings", label: "Bookings", thisWeek: bookedCurrent, lastWeek: bookedPrev, delta: pctDelta(bookedCurrent, bookedPrev) },
    { key: "lessons", label: "Lessons completed", thisWeek: completedCurrent.length, lastWeek: completedPrev.length, delta: pctDelta(completedCurrent.length, completedPrev.length) },
    { key: "attendance", label: "Attendance rate", thisWeek: attendanceCurrent, lastWeek: attendancePrev, delta: pctDelta(attendanceCurrent, attendancePrev), suffix: "%" },
    { key: "cancellations", label: "Cancellations", thisWeek: cancelledCurrent, lastWeek: cancelledPrev, delta: pctDelta(cancelledCurrent, cancelledPrev) },
    { key: "noShows", label: "No-shows", thisWeek: noShowCurrent, lastWeek: noShowPrev, delta: pctDelta(noShowCurrent, noShowPrev) },
    { key: "newLeads", label: "New leads", thisWeek: newLeadsCurrent, lastWeek: newLeadsPrev, delta: pctDelta(newLeadsCurrent, newLeadsPrev) },
    { key: "convertedLeads", label: "Leads converted", thisWeek: convertedCurrent, lastWeek: convertedPrev, delta: pctDelta(convertedCurrent, convertedPrev) },
    { key: "newStudents", label: "New students", thisWeek: newStudentsCurrent, lastWeek: newStudentsPrev, delta: pctDelta(newStudentsCurrent, newStudentsPrev) },
  ];

  return {
    current,
    previous,
    metrics,
    revenueByDay,
    topInstructor,
    pipelineNext7,
  };
}

export function weeklySummaryText(r: WeeklyReport): string {
  const fmt = (m: WeeklyMetric) => {
    const suffix = m.suffix === "%" ? "%" : "";
    const cur = m.suffix === "INR" ? `₹${m.thisWeek.toLocaleString("en-IN")}` : `${m.thisWeek}${suffix}`;
    const prev = m.suffix === "INR" ? `₹${m.lastWeek.toLocaleString("en-IN")}` : `${m.lastWeek}${suffix}`;
    const delta = m.delta === null ? "—" : `${m.delta > 0 ? "+" : ""}${m.delta}% vs last week`;
    return `• ${m.label}: ${cur} (was ${prev}) — ${delta}`;
  };
  const lines = r.metrics.map(fmt);
  if (r.topInstructor) lines.push(`• Top instructor: ${r.topInstructor.name} (${r.topInstructor.lessons} lessons)`);
  lines.push(`• Upcoming in the next 7 days: ${r.pipelineNext7} lessons`);
  return lines.join("\n");
}
