import { NextResponse } from "next/server";

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory per-process limiter. Correct for a single Node instance (the
// default deployment); swap the Map for a shared store (Redis etc.) if the
// app is ever scaled horizontally.
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  if (bucket.count > opts.max) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitedResponse(retryAfterSec: number): NextResponse {
  const res = NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  res.headers.set("retry-after", String(retryAfterSec));
  return res;
}
