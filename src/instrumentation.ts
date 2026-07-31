import type { Instrumentation } from "next";

export function register(): void {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const live = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  console.log(`[smds] server starting (env=${process.env.NODE_ENV}, payments=${live ? "live" : "demo"})`);
  console.log(
    `[smds] database=${process.env.DATABASE_PATH ?? "data/db.sqlite"} site=${process.env.NEXT_PUBLIC_SITE_URL ?? "not set"}`
  );
}

export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[smds] error in ${context.routeType} ${context.routePath}: ${request.method} ${request.path} -> ${message}`);
};
