import { NextResponse } from "next/server";
import { getDB, getVersion } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const db = getDB();
    const collections = (Object.keys(db) as (keyof typeof db)[]).filter((k) => Array.isArray(db[k])).length;
    return NextResponse.json({
      ok: true,
      service: "sri-mathru-driving-school",
      schemaVersion: getVersion(),
      db: { status: "ok", collections },
      mode: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "live" : "demo",
      dbFile: process.env.DATABASE_PATH ?? "data/db.sqlite",
      uptimeSec: Math.floor(process.uptime()),
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, db: { status: "error" } }, { status: 503 });
  }
}
