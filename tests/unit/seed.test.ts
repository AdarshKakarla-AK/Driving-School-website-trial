import { describe, it, expect } from "vitest";
import { rollWindowForward, SCHEDULE } from "@/lib/db/seed";
import { makeSeed } from "../helpers/seed";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAhead = (n: number) => iso(new Date(Date.now() + n * 86400000));

const expectedSlotsForDay = () => SCHEDULE.reduce((a, r) => a + r.shift.length, 0);

describe("seed window rolling", () => {
  it("generates a full 14-day window from an empty slot list", () => {
    const db = makeSeed();
    const added = rollWindowForward(db);
    expect(added).toBeGreaterThan(0);
    const maxDate = db.slots.reduce((m, s) => (s.date > m ? s.date : m), "");
    expect(maxDate).toBe(daysAhead(13));
  });

  it("is a no-op when the window already covers the horizon", () => {
    const db = makeSeed();
    rollWindowForward(db);
    const before = db.slots.length;
    expect(rollWindowForward(db)).toBe(0);
    expect(db.slots.length).toBe(before);
  });

  it("extends a stale window without duplicating or touching existing slots", () => {
    const db = makeSeed();
    const stale = daysAhead(3);
    const beforeStale = db.slots.filter((s) => s.date === stale).length;
    db.slots.push({ id: `${stale}_09:00_inst_ravi`, date: stale, time: "09:00", instructorId: "inst_ravi", vehicleId: "veh_1", status: "available" });

    const added = rollWindowForward(db);
    expect(added).toBeGreaterThan(0);
    const ids = new Set(db.slots.map((s) => s.id));
    expect(ids.size).toBe(db.slots.length);
    expect(db.slots.filter((s) => s.date === stale)).toHaveLength(beforeStale + 1);
  });

  it("skips Sundays", () => {
    const db = makeSeed();
    rollWindowForward(db);
    for (const s of db.slots) {
      const dow = new Date(`${s.date}T00:00:00Z`).getUTCDay();
      expect(dow).not.toBe(0);
    }
  });

  it("creates a slot for every scheduled instructor/time on non-Sunday days", () => {
    const db = makeSeed();
    rollWindowForward(db);
    const sample = daysAhead(5);
    if (new Date(`${sample}T00:00:00Z`).getUTCDay() !== 0) {
      expect(db.slots.filter((s) => s.date === sample)).toHaveLength(expectedSlotsForDay());
    }
  });
});
