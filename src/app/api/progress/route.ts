import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, nowISO } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const db = getDB();
  if (user.role === "student") {
    const prog = db.progresses.find((p) => p.studentId === user.id);
    return NextResponse.json({ progress: prog });
  }
  if (user.role === "instructor") {
    const mine = db.progresses.filter((p) => db.bookings.some((b) => b.studentId === p.studentId && b.instructorId === user.id));
    return NextResponse.json({ progress: mine });
  }
  return NextResponse.json({ progress: db.progresses });
}

// Student self-updates license checklist (e.g. learner license obtained)
export async function PATCH(req: Request) {
  const user = await requireUser();
  const { key, value } = await req.json();
  const db = getDB();
  if (!db.progresses.find((p) => p.studentId === user.id)) {
    mutate((db) => {
      db.progresses.push({ id: `prog_${user.id}`, studentId: user.id, skills: {}, lessonsCompleted: 0, lessonsTotal: 0, licenseChecklist: {}, updatedAt: nowISO() });
    });
  }
  mutate((db) => {
    const prog = db.progresses.find((p) => p.studentId === user.id)!;
    prog.licenseChecklist[key] = value;
    prog.updatedAt = nowISO();
  });
  return NextResponse.json({ ok: true });
}
