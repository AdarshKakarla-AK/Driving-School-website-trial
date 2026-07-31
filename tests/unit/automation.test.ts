import { describe, it, expect, vi } from "vitest";
import {
  runPaymentReminders,
  runLessonReminders,
  runLicenseReminders,
  runBirthdayReminders,
  runDueAutomations,
} from "@/lib/automation";
import { makeSeed, futureDate, seedIds } from "../helpers/seed";
import type { DB, Payment, Booking } from "@/lib/db/types";

vi.mock("@/lib/db/store", () => ({
  uid: (prefix: string) => `${prefix}_test`,
  today: () => "2026-06-15",
  nowISO: () => "2026-06-15T08:00:00.000Z",
}));

function cloneDb(base: DB): DB {
  return {
    ...base,
    users: base.users.map((u) => ({ ...u, documents: u.documents.map((d) => ({ ...d })) })),
    payments: base.payments.map((p) => ({ ...p })),
    bookings: base.bookings.map((b) => ({ ...b })),
    notifications: [],
    automationLogs: [],
  };
}

function studentWith(db: DB, id: string, patch: Record<string, unknown>) {
  const index = db.users.findIndex((u) => u.id === id);
  db.users[index] = { ...db.users[index], ...patch } as DB["users"][number];
  return db.users[index];
}

function pendingPayment(db: DB, patch: Partial<Payment>): Payment {
  const payment: Payment = {
    id: "pay_1",
    ref: "TXN1",
    studentId: seedIds.student1,
    amount: 3500,
    paidAmount: 0,
    method: "emi",
    status: "pending",
    installment: 2,
    dueDate: "2026-06-10",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...patch,
  };
  db.payments.push(payment);
  return payment;
}

function upcomingBooking(db: DB, patch: Partial<Booking>): Booking {
  const booking: Booking = {
    id: "bk_1",
    ref: "BK1",
    studentId: seedIds.student1,
    instructorId: seedIds.instructor,
    vehicleId: seedIds.vehicle,
    date: futureDate(1),
    time: "09:00",
    durationMin: 60,
    status: "confirmed",
    amount: 12000,
    paid: 12000,
    attendance: "na",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...patch,
  };
  db.bookings.push(booking);
  return booking;
}

describe("payment reminders", () => {
  it("reminds for overdue pending payments and marks them reminded", () => {
    const db = cloneDb(makeSeed());
    pendingPayment(db, { id: "pay_1" });
    pendingPayment(db, { id: "pay_2", ref: "TXN2", studentId: seedIds.student2, dueDate: "2026-05-01" });

    expect(runPaymentReminders(db)).toBe(2);
    expect(db.notifications).toHaveLength(4);
    expect(db.notifications.every((n) => n.title === "Payment Reminder 💳")).toBe(true);
    expect(db.automationLogs.every((l) => l.type === "payment_reminder")).toBe(true);
    expect(db.payments.every((p) => p.reminderSentAt)).toBe(true);
  });

  it("skips payments that are not due yet or already reminded", () => {
    const db = cloneDb(makeSeed());
    pendingPayment(db, { id: "pay_1", reminderSentAt: "2026-06-10T00:00:00.000Z" });
    pendingPayment(db, { id: "pay_2", dueDate: "2026-07-01" });
    pendingPayment(db, { id: "pay_3", status: "paid", paidAmount: 3500 });

    expect(runPaymentReminders(db)).toBe(0);
  });

  it("skips students who are inactive", () => {
    const db = cloneDb(makeSeed());
    pendingPayment(db, { id: "pay_1" });
    db.users = db.users.map((u) => (u.id === seedIds.student1 ? { ...u, active: false } : u));
    expect(runPaymentReminders(db)).toBe(0);
  });
});

describe("lesson reminders", () => {
  it("reminds for confirmed lessons starting within 24 hours", () => {
    const db = cloneDb(makeSeed());
    upcomingBooking(db, {});
    const now = Date.parse(`${futureDate(1)}T09:00:00`) - 2 * 60 * 60 * 1000;

    expect(runLessonReminders(db, 24, now)).toBe(1);
    expect(db.bookings[0].reminderSentAt).toBe("2026-06-15T08:00:00.000Z");
    expect(db.automationLogs[0].summary).toContain("Ravi Kumar");
    expect(db.automationLogs[0].summary).toContain(futureDate(1));
  });

  it("does not remind for lessons beyond the horizon or already reminded", () => {
    const db = cloneDb(makeSeed());
    upcomingBooking(db, { id: "bk_1", date: futureDate(3) });
    upcomingBooking(db, { id: "bk_2", reminderSentAt: "2026-06-14T00:00:00.000Z" });

    expect(runLessonReminders(db)).toBe(0);
  });

  it("ignores past, cancelled, and pending-payment lessons", () => {
    const db = cloneDb(makeSeed());
    upcomingBooking(db, { id: "bk_1", date: futureDate(-1) });
    upcomingBooking(db, { id: "bk_2", status: "cancelled" });
    upcomingBooking(db, { id: "bk_3", status: "pending_payment" });

    expect(runLessonReminders(db)).toBe(0);
  });
});

describe("license reminders", () => {
  it("reminds for documents expiring within 30 days", () => {
    const db = cloneDb(makeSeed());
    studentWith(db, seedIds.student1, {
      documents: [
        { id: "doc_1", type: "Learner's License", fileName: "ll.pdf", expiry: "2026-06-30", uploadedAt: "2026-01-01" },
      ],
    });

    expect(runLicenseReminders(db)).toBe(1);
    expect(db.notifications[0].title).toContain("Document Expiry");
    expect(db.users.find((u) => u.id === seedIds.student1)!.documents[0].reminderSentAt).toBeDefined();
  });

  it("skips documents far in the future, expired, or already reminded", () => {
    const db = cloneDb(makeSeed());
    studentWith(db, seedIds.student1, {
      documents: [
        { id: "doc_1", type: "Driving License", fileName: "dl.pdf", expiry: "2026-09-01", uploadedAt: "2026-01-01" },
        { id: "doc_2", type: "Aadhaar", fileName: "aadhaar.pdf", expiry: "2026-05-01", uploadedAt: "2026-01-01" },
        { id: "doc_3", type: "Medical Certificate", fileName: "mc.pdf", expiry: "2026-06-25", reminderSentAt: "2026-06-01T00:00:00.000Z", uploadedAt: "2026-01-01" },
      ],
    });

    expect(runLicenseReminders(db)).toBe(0);
  });
});

describe("birthday reminders", () => {
  function todayDob(): string {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${now.getUTCFullYear() - 20}-${month}-${day}`;
  }

  it("reminds a student once per year on their birthday", () => {
    const db = cloneDb(makeSeed());
    studentWith(db, seedIds.student1, { dob: todayDob() });

    expect(runBirthdayReminders(db)).toBe(1);
    expect(runBirthdayReminders(db)).toBe(0);
    expect(db.users.find((u) => u.id === seedIds.student1)!.birthdayRemindedYear).toBe(new Date().getUTCFullYear());
    expect(db.automationLogs[0].type).toBe("birthday");
  });

  it("does not remind when it is not their birthday or no dob is set", () => {
    const db = cloneDb(makeSeed());
    studentWith(db, seedIds.student1, { dob: "1999-01-01" });
    studentWith(db, seedIds.student2, {});

    expect(runBirthdayReminders(db)).toBe(0);
  });
});

describe("runDueAutomations", () => {
  it("returns a summary of all automation runs", () => {
    const db = cloneDb(makeSeed());
    pendingPayment(db, { id: "pay_1" });
    upcomingBooking(db, {});
    studentWith(db, seedIds.student1, {
      dob: (() => {
        const now = new Date();
        return `${now.getUTCFullYear() - 20}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
      })(),
    });

    const summary = runDueAutomations(db, Date.parse(`${futureDate(1)}T09:00:00`) - 2 * 60 * 60 * 1000);
    expect(summary).toEqual({
      paymentReminders: 1,
      lessonReminders: 1,
      licenseReminders: 0,
      birthdays: 1,
    });
    expect(db.notifications.length).toBeGreaterThan(0);
  });
});
