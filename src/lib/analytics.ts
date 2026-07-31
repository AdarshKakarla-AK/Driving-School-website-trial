import "server-only";
import type { DB } from "./db/types";

const today = () => new Date().toISOString().slice(0, 10);

export function revenueByDay(db: DB, days = 14) {
  const out: { date: string; revenue: number; bookings: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const revenue = db.payments
      .filter((p) => p.status === "paid" && p.createdAt.slice(0, 10) === date)
      .reduce((a, p) => a + p.paidAmount, 0);
    const bookings = db.bookings.filter((b) => b.date === date && b.status !== "cancelled" && b.status !== "no_show").length;
    out.push({ date, revenue, bookings });
  }
  return out;
}

export function revenueByPackage(db: DB) {
  const map = new Map<string, number>();
  db.payments.filter((p) => p.status === "paid").forEach((p) => {
    const key = p.packageId ?? "Other";
    map.set(key, (map.get(key) ?? 0) + p.paidAmount);
  });
  const pkgName = (id: string) => db.packages.find((p) => p.id === id)?.name ?? "Other";
  return [...map.entries()].map(([id, amount]) => ({ name: pkgName(id), amount }));
}

export function leadSources(db: DB) {
  const map = new Map<string, number>();
  db.leads.forEach((l) => map.set(l.source, (map.get(l.source) ?? 0) + 1));
  return [...map.entries()].map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
}

export function analytics(db: DB) {
  const todayStr = today();
  const monthStr = todayStr.slice(0, 7);

  const completed = db.bookings.filter((b) => b.status === "completed");
  const cancelled = db.bookings.filter((b) => b.status === "cancelled");
  const todayBookings = db.bookings.filter((b) => b.date === todayStr && b.status !== "cancelled" && b.status !== "no_show");

  const revenue = db.payments.filter((p) => p.status === "paid");
  const sum = (arr: { paidAmount?: number; amount?: number }[]) => arr.reduce((a, p) => a + (p.paidAmount ?? p.amount ?? 0), 0);
  const revenueToday = sum(revenue.filter((p) => p.createdAt.slice(0, 10) === todayStr));
  const revenueMonth = sum(revenue.filter((p) => p.createdAt.slice(0, 7) === monthStr));
  const totalRevenue = sum(revenue);

  const pendingPayments = sum(db.payments.filter((p) => p.status === "pending"));

  const activeStudents = db.users.filter((u) => u.role === "student" && u.active && !!u.enrolledAt).length;
  const enrolledCount = db.users.filter((u) => u.role === "student").length;

  const instructors = db.users
    .filter((u) => u.role === "instructor")
    .map((u) => ({ id: u.id, name: u.name, rating: u.rating ?? 0, reviewCount: u.reviewCount ?? 0, activeToday: todayBookings.filter((b) => b.instructorId === u.id).length }));

  const leadsTotal = db.leads.length;
  const leadsConverted = db.leads.filter((l) => ["registered", "active", "completed"].includes(l.status)).length;
  const conversion = leadsTotal ? Math.round((leadsConverted / leadsTotal) * 100) : 0;

  const nonPending = db.bookings.filter((b) => !["pending_payment"].includes(b.status));
  const cancellationRate = nonPending.length ? Math.round((cancelled.length / nonPending.length) * 100) : 0;

  const expensesMonth = sum(db.expenses.filter((e) => e.date.slice(0, 7) === monthStr));
  const profit = revenueMonth - expensesMonth;

  const slotsToday = db.slots.filter((s) => s.date === todayStr);
  const bookedToday = slotsToday.filter((s) => s.status === "booked").length;
  const vehicleUtilization = slotsToday.length ? Math.round((bookedToday / slotsToday.length) * 100) : 0;

  const attended = db.bookings.filter((b) => b.status === "completed" && b.attendance !== "absent");
  const attendanceRate = completed.length ? Math.round((attended.length / completed.length) * 100) : 0;

  const retained = db.users.filter((u) => u.role === "student" && db.bookings.filter((b) => b.studentId === u.id && b.status === "completed").length >= 2).length;
  const retention = enrolledCount ? Math.round((retained / enrolledCount) * 100) : 0;

  const avgLessons = enrolledCount ? Math.round((completed.length / enrolledCount) * 10) / 10 : 0;

  return {
    todayBookings: todayBookings.length,
    revenueToday,
    revenueMonth,
    totalRevenue,
    activeStudents,
    enrolledCount,
    pendingPayments,
    instructors,
    conversion,
    cancellationRate,
    expensesMonth,
    profit,
    vehicleUtilization,
    attendanceRate,
    retention,
    avgLessons,
    monthlyGrowth: revenueByDay(db, 30),
    leadSources: leadSources(db),
    revenueByPackage: revenueByPackage(db),
    byDay: revenueByDay(db, 14),
    completedLessons: completed.length,
    upcomingLessons: db.bookings.filter((b) => b.date >= todayStr && !["cancelled", "no_show", "completed"].includes(b.status)).length,
    vehicles: db.vehicles.map((v) => ({ name: v.name, status: v.status })),
  };
}

export function profitTrend(db: DB, months = 6) {
  const out: { month: string; revenue: number; expenses: number; profit: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const revenue = db.payments.filter((p) => p.status === "paid" && p.createdAt.slice(0, 7) === key).reduce((a, p) => a + p.paidAmount, 0);
    const expenses = db.expenses.filter((e) => e.date.slice(0, 7) === key).reduce((a, e) => a + e.amount, 0);
    const monthLabel = d.toLocaleDateString("en-IN", { month: "short" });
    out.push({ month: monthLabel, revenue, expenses, profit: revenue - expenses });
  }
  return out;
}
