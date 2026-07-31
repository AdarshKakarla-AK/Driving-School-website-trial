import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

vi.mock("next/server", () => {
  const makeHeaders = () => {
    const map = new Map<string, string>();
    return {
      set: (k: string, v: string) => {
        map.set(k, v);
      },
      get: (k: string) => map.get(k) ?? null,
    };
  };
  return {
    NextResponse: {
      json: (_body: unknown, init: { status?: number } = {}) => ({ status: init.status ?? 200, headers: makeHeaders() }),
    },
  };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit, then blocks with a retry-after", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const key = "unit-a";

    for (let i = 0; i < 10; i++) {
      expect(rateLimit(key, { max: 10, windowMs: 60000 }).allowed).toBe(true);
    }
    const blocked = rateLimit(key, { max: 10, windowMs: 60000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("resets the counter after the window elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const key = "unit-b";
    for (let i = 0; i < 2; i++) rateLimit(key, { max: 2, windowMs: 60000 });
    expect(rateLimit(key, { max: 2, windowMs: 60000 }).allowed).toBe(false);

    vi.advanceTimersByTime(60001);
    expect(rateLimit(key, { max: 2, windowMs: 60000 }).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("ip-1:login", { max: 1, windowMs: 60000 }).allowed).toBe(true);
    expect(rateLimit("ip-1:register", { max: 1, windowMs: 60000 }).allowed).toBe(true);
    expect(rateLimit("ip-2:login", { max: 1, windowMs: 60000 }).allowed).toBe(true);
    expect(rateLimit("ip-1:login", { max: 1, windowMs: 60000 }).allowed).toBe(false);
    expect(rateLimit("ip-2:login", { max: 1, windowMs: 60000 }).allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for value", () => {
    const req = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } });
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(clientIp(new Request("http://localhost", { headers: { "x-real-ip": "127.0.0.1" } }))).toBe("127.0.0.1");
    expect(clientIp(new Request("http://localhost"))).toBe("unknown");
  });
});

describe("rateLimitedResponse", () => {
  it("returns 429 with a retry-after header", () => {
    const res = rateLimitedResponse(42);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
  });
});
