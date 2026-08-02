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
    hourlyDemand: hourlyDemand(db),
    dayOfWeek: dayOfWeekDemand(db),
    weekPipeline: weekPipeline(db),
    paymentMethods: paymentMethods(db),
    expensesByCategory: expensesByCategory(db),
    leadFunnel: leadFunnel(db),
    referrals: referrals(db),
    forecast: forecast(db),
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

const activeBookings = (db: DB, from: string) => db.bookings.filter((b) => b.date >= from && b.status !== "cancelled" && b.status !== "no_show");

export function hourlyDemand(db: DB, days = 28) {
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const counts = new Array(24).fill(0);
  activeBookings(db, from).forEach((b) => {
    const h = Number(b.time.slice(0, 2));
    if (h >= 0 && h < 24) counts[h] += 1;
  });
  return counts.map((count, hour) => ({
    hour,
    label: `${((hour + 11) % 12) + 1} ${hour < 12 ? "AM" : "PM"}`,
    count,
  }));
}

export function dayOfWeekDemand(db: DB, days = 28) {
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out = names.map((name) => ({ name, count: 0 }));
  activeBookings(db, from).forEach((b) => {
    const day = new Date(`${b.date}T00:00:00`).getDay();
    out[day].count += 1;
  });
  return out;
}

export function weekPipeline(db: DB, days = 7) {
  const today = new Date().toISOString().slice(0, 10);
  const out: { date: string; label: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const count = db.bookings.filter((b) => b.date === date && b.status !== "cancelled" && b.status !== "no_show").length;
    out.push({ date, label: date === today ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }), count });
  }
  return out;
}

export function paymentMethods(db: DB) {
  const map = new Map<string, { count: number; amount: number }>();
  db.payments.filter((p) => p.status === "paid").forEach((p) => {
    const m = map.get(p.method) ?? { count: 0, amount: 0 };
    m.count += 1;
    m.amount += p.paidAmount;
    map.set(p.method, m);
  });
  const labels: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", emi: "EMI", demo: "Demo" };
  return [...map.entries()].map(([method, v]) => ({ name: labels[method] ?? method, count: v.count, amount: v.amount }));
}

export function expensesByCategory(db: DB, month = new Date().toISOString().slice(0, 7)) {
  const map = new Map<string, number>();
  db.expenses.filter((e) => e.date.slice(0, 7) === month).forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  const labels: Record<string, string> = {
    fuel: "Fuel",
    maintenance: "Maintenance",
    salary: "Salaries",
    insurance: "Insurance",
    marketing: "Marketing",
    rent: "Rent",
    utilities: "Utilities",
    other: "Other",
  };
  return [...map.entries()]
    .map(([cat, amount]) => ({ name: labels[cat] ?? cat, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function leadFunnel(db: DB) {
  const counts = { engaged: 0, demoBooked: 0, registered: 0, won: 0, lost: 0 };
  db.leads.forEach((l) => {
    if (l.status === "lost") counts.lost += 1;
    else if (["active", "completed"].includes(l.status)) counts.won += 1;
    else if (l.status === "registered") counts.registered += 1;
    else if (l.status === "demo_booked") counts.demoBooked += 1;
    else counts.engaged += 1;
  });
  const total = db.leads.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return [
    { stage: "Engaged", count: counts.engaged, pct: pct(counts.engaged) },
    { stage: "Demo booked", count: counts.demoBooked, pct: pct(counts.demoBooked) },
    { stage: "Registered", count: counts.registered, pct: pct(counts.registered) },
    { stage: "Won", count: counts.won, pct: pct(counts.won) },
    { stage: "Lost", count: counts.lost, pct: pct(counts.lost) },
  ];
}

export function referrals(db: DB) {
  const referred = db.users.filter((u) => u.role === "student" && !!u.referredBy);
  const referredIds = new Set(referred.map((u) => u.id));
  const referralRevenue = db.payments
    .filter((p) => p.status === "paid" && referredIds.has(p.studentId))
    .reduce((a, p) => a + p.paidAmount, 0);
  const codes = new Map<string, number>();
  referred.forEach((u) => codes.set(u.referredBy!, (codes.get(u.referredBy!) ?? 0) + 1));
  return {
    referredCount: referred.length,
    referralRevenue,
    topCodes: [...codes.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function forecast(db: DB) {
  const monthKey = new Date().toISOString().slice(0, 7);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const recent = db.payments.filter((p) => p.status === "paid" && p.createdAt.slice(0, 10) >= weekAgo);
  const avgDaily = Math.round((recent.reduce((a, p) => a + p.paidAmount, 0) / 7) * 100) / 100;
  const revenueSoFar = db.payments.filter((p) => p.status === "paid" && p.createdAt.slice(0, 7) === monthKey).reduce((a, p) => a + p.paidAmount, 0);
  const projectedMonthEnd = Math.round((revenueSoFar + avgDaily * remainingDays) * 100) / 100;
  const expenses = db.expenses.filter((e) => e.date.slice(0, 7) === monthKey).reduce((a, e) => a + e.amount, 0);
  return { avgDaily, remainingDays, revenueSoFar, projectedMonthEnd, projectedProfit: projectedMonthEnd - expenses };
}
