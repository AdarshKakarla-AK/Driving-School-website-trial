import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/lib/db/database";
import type { DB, Settings, User, Lead, Booking } from "@/lib/db/types";

const tmpDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smds-db-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function cheapSeed(): DB {
  const now = new Date().toISOString();
  const settings: Settings = {
    schoolName: "Test School",
    tagline: "t",
    phone: "1",
    whatsapp: "1",
    email: "t@t.com",
    address: "a",
    branches: [],
    gstin: "G",
    openingHours: "9-6",
    cancellationPolicyHours: 24,
    cancellationFeePct: 10,
    referralDiscount: 0,
    demoMode: true,
  };
  const user: User = {
    id: "usr_1",
    name: "Test Student",
    phone: "1000000000",
    role: "student",
    verified: true,
    active: true,
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
  const lead: Lead = {
    id: "lead_1",
    name: "Test Lead",
    phone: "1000000001",
    source: "walkin",
    status: "new",
    notes: [],
    createdAt: now,
  };
  const booking: Booking = {
    id: "bk_1",
    ref: "BK0001",
    studentId: user.id,
    instructorId: "ins_1",
    vehicleId: "veh_1",
    date: "2026-08-01",
    time: "09:00",
    durationMin: 60,
    status: "confirmed",
    amount: 1000,
    paid: 1000,
    attendance: "na",
    createdAt: now,
  };
  return {
    users: [user],
    packages: [],
    vehicles: [],
    slots: [],
    bookings: [booking],
    lessonNotes: [],
    progresses: [],
    payments: [],
    invoices: [],
    notifications: [],
    automationLogs: [],
    leads: [lead],
    expenses: [],
    payroll: [],
    coupons: [],
    reviews: [],
    certificates: [],
    waitlist: [],
    otps: [],
    auditLogs: [],
    settings,
    counters: {},
  };
}

describe("openDatabase (SQLite persistence)", () => {
  it("seeds a fresh database and persists it", () => {
    const file = path.join(tempDir(), "test.sqlite");
    const db = openDatabase({ file, seed: cheapSeed });
    const users = db.get().users.length;
    expect(users).toBeGreaterThan(0);
    expect(db.get().settings.schoolName).toBe("Test School");
    db.close();

    const reopened = openDatabase({ file, seed: cheapSeed });
    expect(reopened.get().users.length).toBe(users);
    reopened.close();
  });

  it("persists mutations across reopen", () => {
    const file = path.join(tempDir(), "mutate.sqlite");
    const db = openDatabase({ file, seed: cheapSeed });
    const before = db.get().leads.length;
    db.mutate((d) => {
      d.leads.push({
        id: "lead_test",
        name: "Test Lead",
        phone: "1111111111",
        source: "walkin",
        status: "new",
        notes: [],
        createdAt: new Date().toISOString(),
      });
    });
    expect(db.get().leads.length).toBe(before + 1);
    db.close();

    const reopened = openDatabase({ file, seed: cheapSeed });
    expect(reopened.get().leads.some((l) => l.id === "lead_test")).toBe(true);
    reopened.close();
  });

  it("returns the mutation result from mutate()", () => {
    const db = openDatabase({ file: path.join(tempDir(), "result.sqlite"), seed: cheapSeed });
    const out = db.mutate((d) => d.users.length);
    expect(out).toBe(db.get().users.length);
    db.close();
  });

  it("reset() restores the seed and clears mutations", () => {
    const file = path.join(tempDir(), "reset.sqlite");
    const db = openDatabase({ file, seed: cheapSeed });
    db.mutate((d) => d.leads.push({ id: "lead_x", name: "X", phone: "1", source: "walkin", status: "new", notes: [], createdAt: new Date().toISOString() }));
    const reset = db.reset(cheapSeed);
    expect(reset.leads.some((l) => l.id === "lead_x")).toBe(false);
    db.close();

    const reopened = openDatabase({ file, seed: cheapSeed });
    expect(reopened.get().leads.some((l) => l.id === "lead_x")).toBe(false);
    reopened.close();
  });

  it("imports a legacy JSON file on first open", () => {
    const dir = tempDir();
    const jsonFile = path.join(dir, "db.json");
    const partial: DB = { ...cheapSeed(), leads: [], reviews: [] };
    fs.writeFileSync(jsonFile, JSON.stringify(partial));
    const file = path.join(dir, "migrated.sqlite");
    const db = openDatabase({ file, seed: cheapSeed, importJson: jsonFile });
    expect(db.get().leads).toEqual([]);
    db.close();
  });

  it("falls back to seed when JSON import is corrupt", () => {
    const dir = tempDir();
    const jsonFile = path.join(dir, "db.json");
    fs.writeFileSync(jsonFile, "{ this is not json");
    const file = path.join(dir, "corrupt.sqlite");
    const db = openDatabase({ file, seed: cheapSeed, importJson: jsonFile });
    expect(db.get().leads.length).toBeGreaterThan(0);
    db.close();
  });

  it("falls back to seed when the stored kv blob is invalid", () => {
    const file = path.join(tempDir(), "badkv.sqlite");
    const db = openDatabase({ file, seed: cheapSeed });
    db.close();

    const raw = new DatabaseSync(file);
    raw.prepare("INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run("db", "not valid json");
    raw.close();

    const reopened = openDatabase({ file, seed: cheapSeed });
    expect(reopened.get().users.length).toBeGreaterThan(0);
    reopened.close();
  });

  it("rejects an imported blob that is missing required collections", () => {
    const dir = tempDir();
    const jsonFile = path.join(dir, "db.json");
    fs.writeFileSync(jsonFile, JSON.stringify({ users: [] }));
    const file = path.join(dir, "wrongshape.sqlite");
    const db = openDatabase({ file, seed: cheapSeed, importJson: jsonFile });
    expect(db.get().users.length).toBeGreaterThan(0);
    db.close();
  });

  it("works in :memory: mode", () => {
    const db = openDatabase({ file: ":memory:", seed: cheapSeed });
    expect(db.get().bookings.length).toBeGreaterThan(0);
    db.mutate((d) => d.bookings.length);
    db.close();
  });

  it("migrates a legacy single-blob kv database into per-collection rows", () => {
    const file = path.join(tempDir(), "legacy.sqlite");
    const raw = new DatabaseSync(file);
    raw.exec("CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    raw.prepare("INSERT INTO kv (key, value) VALUES (?, ?)").run("db", JSON.stringify(cheapSeed()));
    raw.close();

    const db = openDatabase({ file, seed: cheapSeed });
    expect(db.get().users.length).toBeGreaterThan(0);
    db.close();

    const inspect = new DatabaseSync(file);
    const legacyCount = (inspect.prepare("SELECT COUNT(*) AS n FROM kv WHERE key = ?").get("db") as { n: number }).n;
    const colCount = (inspect.prepare("SELECT COUNT(*) AS n FROM collections").get() as { n: number }).n;
    inspect.close();
    expect(legacyCount).toBe(0);
    expect(colCount).toBeGreaterThanOrEqual(20);
  });

  it("stores each collection in its own row across mutations", () => {
    const file = path.join(tempDir(), "percol.sqlite");
    const db = openDatabase({ file, seed: cheapSeed });
    db.mutate((d) => d.leads.push({ id: "lead_pc", name: "P", phone: "1", source: "walkin", status: "new", notes: [], createdAt: new Date().toISOString() }));
    db.close();

    const inspect = new DatabaseSync(file);
    const leadRow = inspect.prepare("SELECT value FROM collections WHERE name = ?").get("leads") as { value: string };
    const parsed = JSON.parse(leadRow.value) as Array<{ id: string }>;
    inspect.close();
    expect(parsed.some((l) => l.id === "lead_pc")).toBe(true);
  });
});
