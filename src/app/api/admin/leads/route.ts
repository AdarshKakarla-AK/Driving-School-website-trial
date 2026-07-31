import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";
import type { LeadStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  const leads = [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((l) => ({ ...l }));
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const user = await requireUser(["admin"]);
  const { action, leadId, status, note, name, phone, email, source, packageInterested, followUpAt } = await req.json();
  const db = getDB();

  if (action === "create") {
    mutate((db) => {
      db.leads.push({ id: uid("lead"), name, phone, email, source: source ?? "website", status: "new", packageInterested, followUpAt, notes: [], createdAt: nowISO() });
    });
    return NextResponse.json({ ok: true });
  }

  const lead = db.leads.find((l) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  mutate((db) => {
    const l = db.leads.find((x) => x.id === leadId)!;
    if (status) l.status = status as LeadStatus;
    if (note) l.notes.push(note);
    if (followUpAt) l.followUpAt = followUpAt;
    db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "lead_updated", targetId: leadId, meta: status ?? note, createdAt: nowISO() });
  });

  if (status === "registered" && !lead.studentId) {
    const student = db.users.find((u) => u.phone === lead.phone);
    if (!student) {
      notify(db, db.users.find((u) => u.role === "admin")!, "welcome", "Lead converted to registered", `Send payment link to ${lead.name}`, { channels: ["app"] });
    }
  }

  return NextResponse.json({ ok: true });
}
