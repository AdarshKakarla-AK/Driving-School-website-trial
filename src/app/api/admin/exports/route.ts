import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/store";
import { requireUser } from "@/lib/auth";
import { exportCsv } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireUser(["admin"]);
  const type = new URL(req.url).searchParams.get("type") ?? "finance";
  const db = getDB();
  try {
    const csv = exportCsv(db, type);
    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unknown export type." }, { status: 400 });
  }
}
