import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Admin broadcasts (promos/reminders) via the automation engine
export async function POST(req: Request) {
  const user = await requireUser(["admin"]);
  const { audience, title, body, channel } = await req.json();
  const db = getDB();
  let targets = db.users.filter((u) => u.role === "student" && u.active);
  if (audience === "pending_payment") {
    const withPending = new Set(db.payments.filter((p) => p.status === "pending").map((p) => p.studentId));
    targets = targets.filter((u) => withPending.has(u.id));
  } else if (audience === "incomplete") {
    const progIds = new Set(db.progresses.filter((p) => p.lessonsCompleted < p.lessonsTotal).map((p) => p.studentId));
    targets = targets.filter((u) => progIds.has(u.id));
  }

  const sent = targets.length;
  mutate((db) => {
    targets.slice(0, 200).forEach((t) => notify(db, t, "promo", title, body, { channels: [channel ?? "app"] }));
    db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "broadcast_sent", meta: `${audience} · ${sent} recipients · ${title}`, createdAt: nowISO() });
  });
  return NextResponse.json({ ok: true, sent });
}
