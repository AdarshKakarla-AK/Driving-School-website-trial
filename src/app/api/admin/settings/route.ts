import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB } from "@/lib/db/store";
import { resetDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  const { users, payments, bookings, leads, invoices, certificates } = db;
  return NextResponse.json({
    audit: [...db.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50).map((a) => ({ ...a, actor: users.find((u) => u.id === a.actorId)?.name ?? "system" })),
    counts: {
      students: users.filter((u) => u.role === "student").length,
      instructors: users.filter((u) => u.role === "instructor").length,
      bookings: bookings.length,
      payments: payments.length,
      revenue: payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.paidAmount, 0),
      leads: leads.length,
      invoices: invoices.length,
      certificates: certificates.length,
    },
  });
}

export async function POST() {
  await requireUser(["admin"]);
  resetDB();
  return NextResponse.json({ ok: true });
}
