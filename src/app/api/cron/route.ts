import { NextResponse } from "next/server";
import { mutate } from "@/lib/db/store";
import { runDueAutomations } from "@/lib/automation";
import { rollWindowForward } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const url = new URL(request.url);
  const query = url.searchParams.get("token") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : query;
  return provided.length > 0 && provided === secret;
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

function run(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = mutate((db) => {
      rollWindowForward(db);
      return runDueAutomations(db);
    });
    return NextResponse.json({ ok: true, at: new Date().toISOString(), summary });
  } catch {
    return NextResponse.json({ ok: false, error: "Automation run failed" }, { status: 500 });
  }
}
