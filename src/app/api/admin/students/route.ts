import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  const todayStr = new Date().toISOString().slice(0, 10);
  const students = db.users
    .filter((u) => u.role === "student")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((u) => {
      const prog = db.progresses.find((p) => p.studentId === u.id);
      const pkg = db.packages.find((p) => p.id === u.packageId);
      const paid = db.payments.filter((p) => p.studentId === u.id && p.status === "paid").reduce((a, p) => a + p.paidAmount, 0);
      const pending = db.payments.filter((p) => p.studentId === u.id && p.status === "pending").reduce((a, p) => a + p.amount, 0);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        studentId: u.studentId,
        package: pkg?.name,
        active: u.active,
        enrolledAt: u.enrolledAt,
        progress: prog,
        paid,
        pending,
        nextLesson: db.bookings.find((b) => b.studentId === u.id && b.date >= todayStr && !["cancelled", "no_show", "completed"].includes(b.status)),
        instructor: (() => {
          const b = db.bookings.find((b) => b.studentId === u.id && !["cancelled", "no_show"].includes(b.status));
          return b ? db.users.find((x) => x.id === b.instructorId)?.name : undefined;
        })(),
      };
    });
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const user = await requireUser(["admin"]);
  const { studentId, action, note } = await req.json();
  const db = getDB();
  const student = db.users.find((u) => u.id === studentId && u.role === "student");
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  if (action === "toggle_active") {
    mutate((db) => {
      const s = db.users.find((x) => x.id === studentId)!;
      s.active = !s.active;
      db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "student_updated", targetId: studentId, meta: `active=${s.active}`, createdAt: nowISO() });
      if (!student.active) notify(db, student, "welcome", "Welcome back! 🎉", "Your account has been reactivated. Book your next lesson!", { channels: ["app", "whatsapp"] });
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "note") {
    mutate((db) => {
      db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "student_updated", targetId: studentId, meta: note, createdAt: nowISO() });
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
