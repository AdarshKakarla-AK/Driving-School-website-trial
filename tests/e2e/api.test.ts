import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 3111;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, "../..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

// Fresh throwaway database per run so tests are deterministic and never
// pollute the real data/db.sqlite.
const DATA_DIR = path.join(os.tmpdir(), `smds-e2e-${process.pid}`);
const DB_FILE = path.join(DATA_DIR, "db.sqlite");

let server: ChildProcess;

async function waitForServer(url: string, timeoutMs = 90000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

interface ReqOpts {
  method?: string;
  body?: unknown;
  cookie?: string;
}

async function api(route: string, opts: ReqOpts = {}) {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.cookie) headers["cookie"] = opts.cookie;
  const res = await fetch(`${BASE}${route}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

function cookieOf(result: { setCookie: string | null }): string {
  if (!result.setCookie) return "";
  return result.setCookie.split(";")[0];
}

async function login(identifier: string, password: string): Promise<string> {
  const res = await api("/api/auth/login", { method: "POST", body: { identifier, password } });
  expect(res.status).toBe(200);
  const cookie = cookieOf(res);
  expect(cookie).toContain("smds_session");
  return cookie;
}

beforeAll(async () => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "ignore",
    env: { ...process.env, PORT: undefined, DATABASE_PATH: DB_FILE },
  });
  await waitForServer(`${BASE}/api/public/site`);
}, 120000);

afterAll(async () => {
  if (server && !server.killed) {
    server.kill("SIGKILL");
    await Promise.race([
      new Promise<void>((resolve) => server.once("exit", () => resolve())),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.rmSync(DATA_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
});

describe("public endpoints", () => {
  it("serves site info, packages, instructors", async () => {
    const site = await api("/api/public/site");
    expect(site.status).toBe(200);
    expect((site.json as { settings: { schoolName: string } }).settings.schoolName).toBe("Sri Mathru Driving School");

    const packages = await api("/api/public/packages");
    expect(packages.status).toBe(200);
    expect((packages.json as { packages: unknown[] }).packages.length).toBeGreaterThan(0);

    const instructors = await api("/api/public/instructors");
    expect(instructors.status).toBe(200);
    expect((instructors.json as { instructors: unknown[] }).instructors.length).toBeGreaterThan(0);
  });

  it("serves availability", async () => {
    const res = await api("/api/availability?days=3");
    expect(res.status).toBe(200);
    const days = (res.json as { days: { date: string; slots: unknown[] }[] }).days;
    expect(days.length).toBe(3);
    expect(days[0].slots.length).toBeGreaterThan(0);
  });

  it("serves a health check", async () => {
    const res = await api("/api/health");
    expect(res.status).toBe(200);
    const h = res.json as { ok: boolean; schemaVersion: number; db: { status: string; collections: number }; mode: string };
    expect(h.ok).toBe(true);
    expect(h.schemaVersion).toBeGreaterThan(0);
    expect(h.db.status).toBe("ok");
    expect(h.db.collections).toBeGreaterThan(0);
    expect(h.mode).toBe("demo");
  });

  it("rejects a bogus certificate code", async () => {
    const res = await api("/api/certificates", { method: "POST", body: { code: "NOPE-123" } });
    expect(res.status).toBe(404);
  });
});

describe("authentication", () => {
  it("rejects wrong password", async () => {
    const res = await api("/api/auth/login", { method: "POST", body: { identifier: "admin@srimathru.in", password: "wrong" } });
    expect([401, 403]).toContain(res.status);
  });

  it("logs in each role and loads the right dashboard", async () => {
    const admin = await login("admin@srimathru.in", "admin123");
    const a = await api("/api/dashboard", { cookie: admin });
    expect(a.status).toBe(200);
    expect((a.json as { profile: { role: string } }).profile.role).toBe("admin");

    const instructor = await login("ravi@srimathru.in", "demo123");
    const i = await api("/api/dashboard", { cookie: instructor });
    expect((i.json as { profile: { role: string } }).profile.role).toBe("instructor");

    const student = await login("rahul.sharma@gmail.com", "demo123");
    const s = await api("/api/dashboard", { cookie: student });
    expect((s.json as { profile: { role: string } }).profile.role).toBe("student");
  });

  it("blocks unauthenticated and cross-role access", async () => {
    const anon = await api("/api/admin/analytics");
    expect(anon.status).toBe(401);

    const student = await login("rahul.sharma@gmail.com", "demo123");
    const blocked = await api("/api/admin/analytics", { cookie: student });
    expect(blocked.status).toBe(403);
  });

  it("sends and verifies a demo OTP", async () => {
    const phone = "9000000010";
    const send = await api("/api/auth/otp", { method: "POST", body: { action: "send", identifier: phone } });
    expect(send.status).toBe(200);
    const code = (send.json as { demoCode?: string }).demoCode;
    expect(code).toBeTruthy();

    const verify = await api("/api/auth/otp", { method: "POST", body: { action: "verify", identifier: phone, code } });
    expect(verify.status).toBe(200);
    expect(cookieOf(verify)).toContain("smds_session");

    const bad = await api("/api/auth/otp", { method: "POST", body: { action: "verify", identifier: phone, code: "000000" } });
    expect([400, 401, 404]).toContain(bad.status);
  });

  it("logs out and clears the session cookie", async () => {
    const cookie = await login("rahul.sharma@gmail.com", "demo123");
    const out = await api("/api/auth/logout", { method: "POST", cookie });
    expect(out.status).toBe(200);
    expect(out.setCookie ?? "").toContain("smds_session=");
  });
});

describe("booking lifecycle", () => {
  it("books a slot, blocks conflicts, rejects past slots", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const av = await api("/api/availability?days=14");
    const days = (av.json as { days: { date: string; slots: { time: string; status: string }[] }[] }).days;
    const tomorrow = days[1];
    const open = tomorrow.slots.find((s) => s.status === "available");
    expect(open).toBeTruthy();

    const book = await api("/api/bookings", { method: "POST", cookie: student, body: { date: tomorrow.date, time: open!.time } });
    expect(book.status).toBe(200);
    const bookingId = (book.json as { booking: { id: string } }).booking.id;
    expect(bookingId).toBeTruthy();

    const dup = await api("/api/bookings", { method: "POST", cookie: student, body: { date: tomorrow.date, time: open!.time } });
    expect(dup.status).toBe(409);

    const past = await api("/api/bookings", { method: "POST", cookie: student, body: { date: "2020-01-01", time: "09:00" } });
    expect(past.status).toBe(409);
  });

  it("completes a demo payment and confirms the booking", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const list = await api("/api/bookings", { cookie: student });
    const bookings = (list.json as { bookings: { id: string; status: string; amount: number }[] }).bookings;
    const target = bookings.find((b) => ["confirmed", "pending_payment"].includes(b.status) && b.amount > 0);
    expect(target).toBeTruthy();

    const order = await api("/api/payments/order", {
      method: "POST",
      cookie: student,
      body: { bookingId: target!.id, amount: target!.amount, method: "upi" },
    });
    expect(order.status).toBe(200);
    const paymentId = (order.json as { payment: { id: string } }).payment.id;

    const verify = await api("/api/payments/verify", {
      method: "POST",
      cookie: student,
      body: { paymentId, razorpayPaymentId: "pay_demo_e2e" },
    });
    expect(verify.status).toBe(200);

    const after = await api("/api/bookings", { cookie: student });
    const updated = (after.json as { bookings: { id: string; status: string }[] }).bookings.find((b) => b.id === target!.id);
    expect(updated!.status).toBe("confirmed");
  });
});

describe("lesson workflows", () => {
  const instId = "inst_ravi";

  async function bookOpenSlot(student: string): Promise<{ id: string; date: string; time: string }> {
    const av = await api(`/api/availability?days=14&instructorId=${instId}`);
    const days = (av.json as { days: { date: string; slots: { time: string; status: string }[] }[] }).days;
    const open = days[1].slots.find((s) => s.status === "available");
    expect(open).toBeTruthy();
    const book = await api("/api/bookings", { method: "POST", cookie: student, body: { date: days[1].date, time: open!.time, instructorId: instId } });
    expect(book.status).toBe(200);
    return { id: (book.json as { booking: { id: string } }).booking.id, date: days[1].date, time: open!.time };
  }

  it("marks attendance and writes a lesson note", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const booked = await bookOpenSlot(student);

    const instructor = await login("ravi@srimathru.in", "demo123");
    const mark = await api("/api/attendance", { method: "POST", cookie: instructor, body: { bookingId: booked.id, attendance: "present" } });
    expect(mark.status).toBe(200);
    expect((mark.json as { ok: boolean }).ok).toBe(true);

    const note = await api("/api/notes", { method: "POST", cookie: instructor, body: { bookingId: booked.id, note: "Great steering control today.", skillDeltas: { steering: 1 } } });
    expect(note.status).toBe(200);
    expect((note.json as { note: { id: string } }).note.id).toBeTruthy();
  });

  it("reschedules and then cancels a booking", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const booked = await bookOpenSlot(student);

    const av = await api(`/api/availability?days=14&instructorId=${instId}`);
    const days = (av.json as { days: { date: string; slots: { time: string; status: string }[] }[] }).days;
    const target = days
      .slice(1)
      .flatMap((d) => d.slots.filter((s) => s.status === "available").map((s) => ({ date: d.date, time: s.time })))
      .find((s) => !(s.date === booked.date && s.time === booked.time));
    expect(target).toBeTruthy();

    const resched = await api(`/api/bookings/${booked.id}`, { method: "PATCH", cookie: student, body: { action: "reschedule", date: target!.date, time: target!.time } });
    expect(resched.status).toBe(200);
    const newId = (resched.json as { booking: { id: string } }).booking.id;

    const cancel = await api(`/api/bookings/${newId}`, { method: "PATCH", cookie: student, body: { action: "cancel", reason: "e2e cleanup" } });
    expect(cancel.status).toBe(200);
    expect((cancel.json as { ok: boolean }).ok).toBe(true);
  });

  it("rejects rescheduling a past booking", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const booked = await bookOpenSlot(student);
    const resched = await api(`/api/bookings/${booked.id}`, { method: "PATCH", cookie: student, body: { action: "reschedule", date: "2020-01-01", time: "09:00" } });
    expect(resched.status).toBe(409);
  });

  it("joins the waitlist only for a taken slot", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const booked = await bookOpenSlot(student);

    const student2 = await login("priya.nair@gmail.com", "demo123");
    const wl = await api("/api/waitlist", { method: "POST", cookie: student2, body: { instructorId: instId, date: booked.date, time: booked.time } });
    expect(wl.status).toBe(200);
    expect((wl.json as { entry: { id: string } }).entry.id).toBeTruthy();

    const av = await api(`/api/availability?days=14&instructorId=${instId}`);
    const days = (av.json as { days: { date: string; slots: { time: string; status: string }[] }[] }).days;
    const open = days[3].slots.find((s) => s.status === "available");
    const free = await api("/api/waitlist", { method: "POST", cookie: student2, body: { instructorId: instId, date: days[3].date, time: open!.time } });
    expect(free.status).toBe(409);
  });

  it("uploads a student document", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const doc = await api("/api/documents", { method: "POST", cookie: student, body: { type: "Driving License", number: "KA01202500001" } });
    expect(doc.status).toBe(200);
    expect((doc.json as { ok: boolean }).ok).toBe(true);
  });
});

describe("admin operations", () => {
  let admin: string;

  beforeAll(async () => {
    admin = await login("admin@srimathru.in", "admin123");
  });

  it("sends a broadcast to students", async () => {
    const res = await api("/api/admin/broadcast", { method: "POST", cookie: admin, body: { audience: "all", title: "E2E Promo", body: "Flat 10% off this week!", channel: "app" } });
    expect(res.status).toBe(200);
    expect((res.json as { sent: number }).sent).toBeGreaterThan(0);
  });

  it("lists students with enrichment", async () => {
    const res = await api("/api/admin/students", { cookie: admin });
    expect(res.status).toBe(200);
    const students = (res.json as { students: { name: string; progress?: unknown }[] }).students;
    expect(students.length).toBeGreaterThan(0);
    expect(students[0].name).toBeTruthy();
  });

  it("reads analytics and expense/payroll endpoints", async () => {
    const analytics = await api("/api/admin/analytics", { cookie: admin });
    expect(analytics.status).toBe(200);
    const a = (analytics.json as { analytics: { totalRevenue: number; enrolledCount: number } }).analytics;
    expect(a.totalRevenue).toBeGreaterThan(0);

    const expenses = await api("/api/admin/expenses", { cookie: admin });
    expect(expenses.status).toBe(200);

    const payroll = await api("/api/admin/payroll", { cookie: admin });
    expect(payroll.status).toBe(200);
  });

  it("creates and updates a lead", async () => {
    const create = await api("/api/admin/leads", {
      method: "POST",
      cookie: admin,
      body: { action: "create", name: "E2E Lead", phone: "9988776655", source: "website" },
    });
    expect(create.status).toBe(200);

    const list = await api("/api/admin/leads", { cookie: admin });
    const lead = (list.json as { leads: { id: string; name: string }[] }).leads.find((l) => l.name === "E2E Lead");
    expect(lead).toBeTruthy();

    const update = await api("/api/admin/leads", { method: "POST", cookie: admin, body: { action: "status", leadId: lead!.id, status: "called", note: "contacted" } });
    expect(update.status).toBe(200);
  });

  it("validates a coupon rejection path", async () => {
    const student = await login("rahul.sharma@gmail.com", "demo123");
    const res = await api("/api/payments/order", {
      method: "POST",
      cookie: student,
      body: { amount: 500, couponCode: "NOPE" },
    });
    expect(res.status).toBe(400);
  });

  it("generates and removes a payroll record", async () => {
    const before = await api("/api/admin/payroll", { cookie: admin });
    const instructors = (before.json as { instructors: { id: string }[] }).instructors;
    expect(instructors.length).toBeGreaterThan(0);

    const create = await api("/api/admin/payroll", {
      method: "POST",
      cookie: admin,
      body: { instructorId: instructors[0].id, month: "2099-01", lessons: 20, base: 16000, bonus: 1000, commission: 2000, status: "pending" },
    });
    expect(create.status).toBe(200);

    const list = await api("/api/admin/payroll", { cookie: admin });
    const rec = (list.json as { payroll: { id: string; instructorId: string; month: string; total: number }[] }).payroll.find((p) => p.month === "2099-01");
    expect(rec).toBeTruthy();
    expect(rec!.total).toBe(19000);

    const del = await api("/api/admin/payroll", { method: "DELETE", cookie: admin, body: { id: rec!.id } });
    expect(del.status).toBe(200);
  });

  it("creates and deletes an expense", async () => {
    const create = await api("/api/admin/expenses", {
      method: "POST",
      cookie: admin,
      body: { category: "fuel", amount: 1234, note: "E2E fuel test", date: "2099-01-01" },
    });
    expect(create.status).toBe(200);

    const list = await api("/api/admin/expenses", { cookie: admin });
    const exp = (list.json as { expenses: { id: string; note: string }[] }).expenses.find((e) => e.note === "E2E fuel test");
    expect(exp).toBeTruthy();

    const del = await api("/api/admin/expenses", { method: "DELETE", cookie: admin, body: { id: exp!.id } });
    expect(del.status).toBe(200);
  });

  it("creates, disables, and deletes a coupon", async () => {
    const create = await api("/api/admin/coupons", {
      method: "POST",
      cookie: admin,
      body: { code: "E2E50", type: "percent", value: 50, maxUses: 5, validFrom: "2020-01-01", validTo: "2999-12-31" },
    });
    expect(create.status).toBe(200);

    const list = await api("/api/admin/coupons", { cookie: admin });
    const coupon = (list.json as { coupons: { id: string; code: string; active: boolean }[] }).coupons.find((c) => c.code === "E2E50");
    expect(coupon).toBeTruthy();
    expect(coupon!.active).toBe(true);

    const disable = await api("/api/admin/coupons", { method: "PATCH", cookie: admin, body: { id: coupon!.id, active: false } });
    expect(disable.status).toBe(200);
    const afterDisable = await api("/api/admin/coupons", { cookie: admin });
    expect((afterDisable.json as { coupons: { id: string; active: boolean }[] }).coupons.find((c) => c.id === coupon!.id)!.active).toBe(false);

    const del = await api("/api/admin/coupons", { method: "DELETE", cookie: admin, body: { id: coupon!.id } });
    expect(del.status).toBe(200);
  });
});

describe("registration", () => {
  it("registers a new student, signs them in, and rejects duplicates", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "E2E Student", phone: "7000000999", password: "e2e1234", source: "e2e" },
    });
    expect(res.status).toBe(200);
    expect((res.json as { ok: boolean }).ok).toBe(true);
    expect(cookieOf(res)).toContain("smds_session");

    const dup = await api("/api/auth/register", {
      method: "POST",
      body: { name: "E2E Student", phone: "7000000999", password: "e2e1234" },
    });
    expect(dup.status).toBe(409);

    const bad = await api("/api/auth/register", {
      method: "POST",
      body: { name: "X", phone: "123", password: "pw" },
    });
    expect(bad.status).toBe(400);
  });
});

describe("notifications", () => {
  it("records booking notifications and supports mark-all-read", async () => {
    const student = await login("priya.nair@gmail.com", "demo123");
    const av = await api("/api/availability?days=14");
    const days = (av.json as { days: { date: string; slots: { time: string; status: string }[] }[] }).days;
    const open = days.slice(2).flatMap((d) => d.slots.filter((s) => s.status === "available").map((s) => ({ date: d.date, time: s.time })));
    expect(open.length).toBeGreaterThan(0);

    const book = await api("/api/bookings", { method: "POST", cookie: student, body: open[0] });
    expect(book.status).toBe(200);

    const list = await api("/api/notifications", { cookie: student });
    expect(list.status).toBe(200);
    const payload = list.json as { notifications: { title: string; read: boolean }[]; unread: number };
    expect(payload.notifications.some((n) => /Lesson Booked/.test(n.title))).toBe(true);

    const mark = await api("/api/notifications", { method: "POST", cookie: student, body: { all: true } });
    expect(mark.status).toBe(200);

    const after = await api("/api/notifications", { cookie: student });
    expect((after.json as { unread: number }).unread).toBe(0);
  });
});

describe("certificates", () => {
  it("verifies a real certificate by code", async () => {
    const student = await login("lakshmi.v@gmail.com", "demo123");
    const mine = await api("/api/certificates", { cookie: student });
    const certs = (mine.json as { certificates: { code: string; student: string }[] }).certificates;
    expect(certs.length).toBeGreaterThan(0);

    const verify = await api("/api/certificates", { method: "POST", body: { code: certs[0].code } });
    expect(verify.status).toBe(200);
    expect((verify.json as { certificate: { student: string; package: string } }).certificate.student).toBeTruthy();
    expect((verify.json as { certificate: { student: string; package: string } }).certificate.package).toBeTruthy();
  });
});
