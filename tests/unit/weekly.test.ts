import { describe, it, expect } from "vitest";
import { weekRange, weeklyReport, pctDelta, weeklySummaryText } from "@/lib/weekly";
import { weeklyExport } from "@/lib/export";
import { makeSeed, seedIds } from "../helpers/seed";
import type { DB, Payment, Booking } from "@/lib/db/types";

function mondayDate(weeksAgo = 0): Date {
  const now = new Date();
  const sinceMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - sinceMonday - weeksAgo * 7));
}

function iso(offsetDays: number, weeksAgo = 0): string {
  return new Date(mondayDate(weeksAgo).getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
}

function paidPayment(db: DB, patch: Partial<Payment>): void {
  db.payments.push({
    id: `pay_${db.payments.length}`,
    ref: `TXN${db.payments.length}`,
    studentId: seedIds.student1,
    amount: 1000,
    paidAmount: 1000,
    method: "upi",
    status: "paid",
    invoiceNo: "INV-1",
    createdAt: `${iso(0)}T10:00:00.000Z`,
    ...patch,
  });
}

function booking(db: DB, patch: Partial<Booking>): void {
  db.bookings.push({
    id: `bk_${db.bookings.length}`,
    ref: `BK${db.bookings.length}`,
    studentId: seedIds.student1,
    instructorId: seedIds.instructor,
    vehicleId: seedIds.vehicle,
    date: iso(1),
    time: "09:00",
    durationMin: 60,
    status: "completed",
    amount: 12000,
    paid: 12000,
    attendance: "present",
    createdAt: `${iso(0)}T08:00:00.000Z`,
    ...patch,
  });
}

describe("weekRange", () => {
  it("returns the Monday of the current week", () => {
    const r = weekRange(0);
    expect(new Date(`${r.start}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it("returns a 7-day window and offsets by weeks", () => {
    const current = weekRange(0);
    const previous = weekRange(1);
    const day = new Date(`${current.start}T00:00:00Z`).getTime();
    expect(new Date(`${current.end}T00:00:00Z`).getTime() - day).toBe(6 * 86400000);
    expect(previous.end).toBe(new Date(day - 86400000).toISOString().slice(0, 10));
  });
});

describe("pctDelta", () => {
  it("computes percentage change and guards zero", () => {
    expect(pctDelta(120, 100)).toBe(20);
    expect(pctDelta(80, 100)).toBe(-20);
    expect(pctDelta(50, 0)).toBe(100);
    expect(pctDelta(0, 0)).toBeNull();
  });
});

describe("weeklyReport", () => {
  it("computes revenue this week vs last week", () => {
    const db = makeSeed();
    paidPayment(db, { paidAmount: 2000, createdAt: `${iso(1)}T10:00:00.000Z` });
    paidPayment(db, { paidAmount: 5000, createdAt: `${iso(-7)}T10:00:00.000Z` });
    const r = weeklyReport(db, 0, mondayDate());

    const revenue = r.metrics.find((m) => m.key === "revenue")!;
    expect(revenue.thisWeek).toBe(2000);
    expect(revenue.lastWeek).toBe(5000);
    expect(revenue.delta).toBe(-60);
  });

  it("counts completed lessons, attendance, cancellations and no-shows", () => {
    const db = makeSeed();
    booking(db, { attendance: "present" });
    booking(db, { id: "bk_1", attendance: "absent" });
    booking(db, { id: "bk_2", status: "cancelled", date: iso(2) });
    booking(db, { id: "bk_3", status: "no_show", date: iso(3) });
    const r = weeklyReport(db, 0, mondayDate());

    const lessons = r.metrics.find((m) => m.key === "lessons")!;
    expect(lessons.thisWeek).toBe(2);
    const attendance = r.metrics.find((m) => m.key === "attendance")!;
    expect(attendance.thisWeek).toBe(50);
    expect(r.metrics.find((m) => m.key === "cancellations")!.thisWeek).toBe(1);
    expect(r.metrics.find((m) => m.key === "noShows")!.thisWeek).toBe(1);
  });

  it("picks the top instructor by completed lessons", () => {
    const db = makeSeed();
    booking(db, { id: "bk_1", instructorId: seedIds.instructor });
    booking(db, { id: "bk_2", instructorId: seedIds.instructor });
    booking(db, { id: "bk_3", instructorId: "ins_other" });
    db.users.push({
      id: "ins_other",
      name: "Meera",
      phone: "9000000099",
      role: "instructor",
      verified: true,
      active: true,
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const r = weeklyReport(db, 0, mondayDate());
    expect(r.topInstructor).toEqual({ name: "Ravi Kumar", lessons: 2 });
  });

  it("counts pipeline for the next 7 days", () => {
    const db = makeSeed();
    booking(db, { id: "bk_1", status: "confirmed", date: iso(1) });
    booking(db, { id: "bk_2", status: "confirmed", date: iso(3) });
    booking(db, { id: "bk_3", status: "cancelled", date: iso(2) });
    const r = weeklyReport(db, 0, mondayDate());
    expect(r.pipelineNext7).toBe(2);
  });

  it("builds 14 days of revenue with both weeks", () => {
    const db = makeSeed();
    paidPayment(db, { paidAmount: 100, createdAt: `${iso(0)}T10:00:00.000Z` });
    paidPayment(db, { paidAmount: 50, createdAt: `${iso(-7)}T10:00:00.000Z` });
    const r = weeklyReport(db, 0, mondayDate());
    expect(r.revenueByDay).toHaveLength(14);
    expect(r.revenueByDay.some((d) => d.revenue === 100)).toBe(true);
    expect(r.revenueByDay.some((d) => d.revenue === 50)).toBe(true);
  });
});

describe("weeklyExport", () => {
  it("renders metric rows with a header", () => {
    const db = makeSeed();
    paidPayment(db, { paidAmount: 2000, createdAt: `${iso(0)}T10:00:00.000Z` });
    const csv = weeklyExport(db, 0);
    expect(csv).toContain("Metric,This Week,Last Week,Change");
    expect(csv).toContain("Revenue,2000,0,+100%");
    expect(csv).toContain("Day,Date,Revenue");
  });
});

describe("weeklySummaryText", () => {
  it("renders human-readable lines", () => {
    const db = makeSeed();
    booking(db, { id: "bk_1" });
    const r = weeklyReport(db, 0, mondayDate());
    const text = weeklySummaryText(r);
    expect(text).toContain("Revenue: ₹0 (was ₹0)");
    expect(text).toContain("Top instructor: Ravi Kumar");
  });
});
