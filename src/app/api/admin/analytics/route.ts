import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analytics, profitTrend } from "@/lib/analytics";
import { getDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  const automation = [...db.automationLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  const byType = automation.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byChannel = automation.reduce((acc, l) => {
    acc[l.channel] = (acc[l.channel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return NextResponse.json({
    analytics: analytics(db),
    profitTrend: profitTrend(db, 6),
    automation,
    byType,
    byChannel,
    totalAutomations: db.automationLogs.length,
  });
}
