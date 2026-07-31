import { describe, it, expect } from "vitest";
import { makeSeed, seedIds } from "../helpers/seed";
import { analytics, revenueByPackage, profitTrend, leadSources, revenueByDay } from "@/lib/analytics";

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
});
