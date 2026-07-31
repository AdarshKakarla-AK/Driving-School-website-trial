import { describe, it, expect, vi } from "vitest";
import { cn, formatINR, formatDate, formatTime, fullDayLabel, timeToMinutes, dayLabel, initials, isPast, greeting } from "@/lib/utils";

describe("utils", () => {
  it("cn merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", false && "text-blue-500")).toBe("text-red-500");
  });

  it("formatINR uses en-IN grouping", () => {
    expect(formatINR(123456)).toBe("₹1,23,456");
  });

  it("formatTime converts 24h to 12h", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("12:30")).toBe("12:30 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("19:45")).toBe("7:45 PM");
  });

  it("timeToMinutes converts correctly", () => {
    expect(timeToMinutes("06:30")).toBe(390);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("dayLabel produces a short label", () => {
    expect(dayLabel("2026-07-31")).toMatch(/Jul/);
  });

  it("initials takes up to two letters", () => {
    expect(initials("Rahul Sharma")).toBe("RS");
    expect(initials("Priya")).toBe("P");
  });

  it("formatDate formats a date or falls back to a dash", () => {
    expect(formatDate("2026-07-31")).toMatch(/Jul/);
    expect(formatDate("")).toBe("-");
  });

  it("fullDayLabel produces a long label", () => {
    expect(fullDayLabel("2026-07-31")).toMatch(/July/);
  });

  it("isPast distinguishes past and future datetimes", () => {
    expect(isPast("2000-01-01", "00:00")).toBe(true);
    expect(isPast("2999-01-01", "00:00")).toBe(false);
  });

  it("greeting depends on the time of day", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-31T09:00:00"));
      expect(greeting()).toBe("Good morning");
      vi.setSystemTime(new Date("2026-07-31T14:00:00"));
      expect(greeting()).toBe("Good afternoon");
      vi.setSystemTime(new Date("2026-07-31T20:00:00"));
      expect(greeting()).toBe("Good evening");
    } finally {
      vi.useRealTimers();
    }
  });
});
