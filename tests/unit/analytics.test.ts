import { describe, it, expect } from "vitest";
import { makeSeed, seedIds, futureDate } from "../helpers/seed";
import {
  analytics,
  revenueByPackage,
  profitTrend,
  leadSources,
  revenueByDay,
  hourlyDemand,
  dayOfWeekDemand,
  weekPipeline,
  paymentMethods,
  expensesByCategory,
  leadFunnel,
  referrals,
  forecast,
} from "@/lib/analytics";

describe("analytics", () => {
  it("computes revenue totals from paid payments", () => {
    const db = makeSeed();
    const now = new Date().toISOString();
    db.payments.push(
      { id: "p1", ref: "R1", studentId: seedIds.student1, amount: 12000, paidAmount: 12000, method: "upi", status: "paid", createdAt: now },
      { id: "p2", ref: "R2", studentId: seedIds.student2, amount: 5000, paidAmount: 2000, method: "card", status: "pending", createdAt: now }
    );
    const a = analytics(db);
    expect(a.totalRevenue).toBe(12000);
    expect(a.revenueToday).toBe(12000);
    expect(a.pendingPayments).toBe(2000);
  });

  it("counts enrolled and active students", () => {
    const db = makeSeed();
    const a = analytics(db);
    expect(a.enrolledCount).toBe(2);
    expect(a.activeStudents).toBe(1);
  });

  it("computes conversion from leads", () => {
    const db = makeSeed();
    db.leads.push(
      { id: "l1", name: "A", phone: "1", source: "walkin", status: "registered", notes: [], createdAt: new Date().toISOString() },
      { id: "l2", name: "B", phone: "2", source: "google", status: "new", notes: [], createdAt: new Date().toISOString() }
    );
    const a = analytics(db);
    expect(a.conversion).toBe(50);
  });

  it("aggregates revenue by package", () => {
    const db = makeSeed();
    const now = new Date().toISOString();
    db.payments.push(
      { id: "p1", ref: "R1", studentId: seedIds.student1, packageId: seedIds.pkg, amount: 6000, paidAmount: 6000, method: "upi", status: "paid", createdAt: now },
      { id: "p2", ref: "R2", studentId: seedIds.student2, amount: 3000, paidAmount: 3000, method: "upi", status: "paid", createdAt: now }
    );
    const byPkg = revenueByPackage(db);
    expect(byPkg.find((x) => x.name === "Basic Driving Course")!.amount).toBe(6000);
    expect(byPkg.find((x) => x.name === "Other")!.amount).toBe(3000);
  });

  it("revenueByDay buckets paid payments by day", () => {
    const db = makeSeed();
    db.payments.push({ id: "p1", ref: "R1", studentId: seedIds.student1, amount: 1000, paidAmount: 1000, method: "upi", status: "paid", createdAt: new Date().toISOString() });
    const days = revenueByDay(db, 7);
    expect(days).toHaveLength(7);
    expect(days[days.length - 1].revenue).toBe(1000);
  });

  it("profitTrend nets revenue against expenses", () => {
    const db = makeSeed();
    db.payments.push({ id: "p1", ref: "R1", studentId: seedIds.student1, amount: 10000, paidAmount: 10000, method: "upi", status: "paid", createdAt: new Date().toISOString() });
    db.expenses.push({ id: "e1", category: "fuel", amount: 2500, note: "diesel", date: new Date().toISOString().slice(0, 10) });
    const trend = profitTrend(db, 1);
    expect(trend).toHaveLength(1);
    expect(trend[0].revenue).toBe(10000);
    expect(trend[0].expenses).toBe(2500);
    expect(trend[0].profit).toBe(7500);
  });

  it("leadSources counts leads by source", () => {
    const db = makeSeed();
    db.leads.push(
      { id: "l1", name: "A", phone: "1", source: "walkin", status: "new", notes: [], createdAt: new Date().toISOString() },
      { id: "l2", name: "B", phone: "2", source: "walkin", status: "new", notes: [], createdAt: new Date().toISOString() },
      { id: "l3", name: "C", phone: "3", source: "google", status: "new", notes: [], createdAt: new Date().toISOString() }
    );
    const sources = leadSources(db);
    expect(sources.find((s) => s.name === "Walkin")!.value).toBe(2);
    expect(sources.find((s) => s.name === "Google")!.value).toBe(1);
  });

  it("hourlyDemand buckets non-cancelled bookings by hour", () => {
    const db = makeSeed();
    const t = futureDate(0);
    db.bookings.push(
      { id: "b1", ref: "B1", studentId: seedIds.student1, instructorId: seedIds.instructor, vehicleId: seedIds.vehicle, date: t, time: "18:30", durationMin: 60, status: "confirmed", amount: 0, paid: 0, attendance: "na", createdAt: new Date().toISOString() },
      { id: "b2", ref: "B2", studentId: seedIds.student2, instructorId: seedIds.instructor, vehicleId: seedIds.vehicle, date: t, time: "18:30", durationMin: 60, status: "cancelled", amount: 0, paid: 0, attendance: "na", createdAt: new Date().toISOString() },
      { id: "b3", ref: "B3", studentId: seedIds.student2, instructorId: seedIds.instructor, vehicleId: seedIds.vehicle, date: t, time: "07:15", durationMin: 60, status: "completed", amount: 0, paid: 0, attendance: "present", createdAt: new Date().toISOString() }
    );
    const h = hourlyDemand(db);
    expect(h).toHaveLength(24);
    expect(h[18].count).toBe(1);
    expect(h[18].label).toBe("6 PM");
    expect(h[7].count).toBe(1);
  });

  it("dayOfWeekDemand buckets bookings by weekday", () => {
    const db = makeSeed();
    const today = futureDate(0);
    const weekday = new Date(`${today}T00:00:00`).getDay();
    db.bookings.push({ id: "b1", ref: "B1", studentId: seedIds.student1, instructorId: seedIds.instructor, vehicleId: seedIds.vehicle, date: today, time: "10:00", durationMin: 60, status: "confirmed", amount: 0, paid: 0, attendance: "na", createdAt: new Date().toISOString() });
    const d = dayOfWeekDemand(db);
    expect(d).toHaveLength(7);
    expect(d[weekday].count).toBe(1);
  });

  it("weekPipeline covers the next 7 days and flags today", () => {
    const db = makeSeed();
    const today = futureDate(0);
    db.bookings.push({ id: "b1", ref: "B1", studentId: seedIds.student1, instructorId: seedIds.instructor, vehicleId: seedIds.vehicle, date: today, time: "10:00", durationMin: 60, status: "confirmed", amount: 0, paid: 0, attendance: "na", createdAt: new Date().toISOString() });
    const w = weekPipeline(db);
    expect(w).toHaveLength(7);
    expect(w[0].label).toBe("Today");
    expect(w[0].count).toBe(1);
  });

  it("paymentMethods aggregates paid payments by method", () => {
    const db = makeSeed();
    const now = new Date().toISOString();
    db.payments.push(
      { id: "p1", ref: "R1", studentId: seedIds.student1, amount: 1000, paidAmount: 1000, method: "upi", status: "paid", createdAt: now },
      { id: "p2", ref: "R2", studentId: seedIds.student2, amount: 2000, paidAmount: 2000, method: "card", status: "paid", createdAt: now },
      { id: "p3", ref: "R3", studentId: seedIds.student2, amount: 500, paidAmount: 500, method: "upi", status: "pending", createdAt: now }
    );
    const m = paymentMethods(db);
    expect(m.find((x) => x.name === "UPI")).toMatchObject({ count: 1, amount: 1000 });
    expect(m.find((x) => x.name === "Card")).toMatchObject({ count: 1, amount: 2000 });
  });

  it("expensesByCategory sums current-month expenses and sorts desc", () => {
    const db = makeSeed();
    const t = new Date().toISOString().slice(0, 10);
    db.expenses.push(
      { id: "e1", category: "fuel", amount: 2500, note: "diesel", date: t },
      { id: "e2", category: "rent", amount: 4000, note: "shop", date: t }
    );
    const e = expensesByCategory(db);
    expect(e[0]).toMatchObject({ name: "Rent", amount: 4000 });
    expect(e[1]).toMatchObject({ name: "Fuel", amount: 2500 });
  });

  it("leadFunnel buckets leads across pipeline stages", () => {
    const db = makeSeed();
    const now = new Date().toISOString();
    ["new", "demo_booked", "registered", "active", "lost"].forEach((status, i) => {
      db.leads.push({ id: `l${i}`, name: "A", phone: "1", source: "google", status: status as never, notes: [], createdAt: now });
    });
    const f = leadFunnel(db);
    expect(f.find((x) => x.stage === "Engaged")!.count).toBe(1);
    expect(f.find((x) => x.stage === "Demo booked")!.count).toBe(1);
    expect(f.find((x) => x.stage === "Registered")!.count).toBe(1);
    expect(f.find((x) => x.stage === "Won")!.count).toBe(1);
    expect(f.find((x) => x.stage === "Lost")!.count).toBe(1);
    expect(f[0].pct).toBe(20);
  });

  it("referrals counts referred students, revenue and top codes", () => {
    const db = makeSeed();
    db.users.find((u) => u.id === seedIds.student2)!.referredBy = "ARUN1";
    const now = new Date().toISOString();
    db.payments.push({ id: "p1", ref: "R1", studentId: seedIds.student2, amount: 8000, paidAmount: 8000, method: "upi", status: "paid", createdAt: now });
    const r = referrals(db);
    expect(r.referredCount).toBe(1);
    expect(r.referralRevenue).toBe(8000);
    expect(r.topCodes).toEqual([{ code: "ARUN1", count: 1 }]);
  });

  it("forecast projects month-end from the 7-day average", () => {
    const db = makeSeed();
    const paid = 7000;
    db.payments.push({ id: "p1", ref: "R1", studentId: seedIds.student1, amount: paid, paidAmount: paid, method: "upi", status: "paid", createdAt: new Date().toISOString() });
    const f = forecast(db);
    expect(f.avgDaily).toBe(1000);
    expect(f.remainingDays).toBeGreaterThanOrEqual(0);
    expect(f.revenueSoFar).toBe(paid);
    expect(f.projectedMonthEnd).toBeGreaterThanOrEqual(paid);
    expect(f.projectedProfit).toBe(f.projectedMonthEnd);
  });
});
