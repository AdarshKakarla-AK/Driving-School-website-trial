import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDB();
  return NextResponse.json({ packages: db.packages.filter((p) => p.active !== false), settings: db.settings });
}
