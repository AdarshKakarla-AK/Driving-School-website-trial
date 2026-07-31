import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";
import type { Attendance } from "@/lib/db/types";

export const dynamic = "force-dynamic";

// Instructor marks attendance for a lesson; progress + certificates auto-update
export async function POST(req: Request) {
  const user = await requireUser(["instructor", "admin"]);
  const { bookingId, attendance } = await req.json();
  const db = getDB();

  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (!["present", "absent", "late"].includes(attendance as string)) {
    return NextResponse.json({ error: "Invalid attendance value." }, { status: 400 });
  }

  const student = db.users.find((u) => u.id === booking.studentId);
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const result: { certificate?: string; reviewAsked?: boolean } = {};

  mutate((db) => {
    const b = db.bookings.find((x) => x.id === bookingId)!;
    b.attendance = attendance as Attendance;
    b.status = "completed";

    if (attendance !== "absent") {
      const prog = db.progresses.find((p) => p.studentId === booking.studentId);
      if (prog) {
        prog.lessonsCompleted += 1;
        prog.updatedAt = nowISO();
      }
      const pkg = db.packages.find((p) => p.id === booking.packageId);
      const completed = db.bookings.filter((x) => x.studentId === booking.studentId && x.status === "completed" && x.attendance !== "absent").length;
      const total = pkg?.sessions ?? 0;

      // apply latest skill deltas from notes
      const latestNote = db.lessonNotes
        .filter((n) => n.studentId === booking.studentId)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latestNote && prog) {
        Object.entries(latestNote.skillDeltas).forEach(([skill, delta]) => {
          if (prog.skills[skill]) {
            const newVal = Math.min(5, Math.max(1, (prog.skills[skill].value ?? 1) + delta));
            prog.skills[skill] = { value: newVal, history: [...prog.skills[skill].history, { date: todayNow(), value: newVal }] };
          }
        });
      }

      if (total > 0 && completed >= total) {
        const code = `SMCERT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        if (!db.certificates.find((c) => c.studentId === booking.studentId)) {
          db.certificates.push({ id: uid("cert"), studentId: booking.studentId, packageId: booking.packageId!, code, issuedAt: nowISO(), signedBy: "Suresh Mathru (Director)" });
          result.certificate = code;
          notify(db, student, "course_completed", "Course Completed! 🎓", `Congrats! Your certificate ${code} is ready. Download it and leave a review!`, { channels: ["app", "whatsapp", "email"], meta: "/portal/dashboard?tab=certificates" });
          notify(db, student, "feedback_request", "How was your experience? ⭐", "Rate your experience. 5 stars? We'd love a Google review!", { channels: ["app", "whatsapp"], meta: "/portal/dashboard?tab=reviews" });
          result.reviewAsked = true;
        }
      }
    }
    db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "attendance_marked", targetId: bookingId, meta: attendance, createdAt: nowISO() });
    notify(db, student, "booking_confirmed", `Lesson marked ${attendance}`, `Your lesson on ${booking.date} was marked ${attendance} by ${user.name}.`, { channels: ["app"] });
  });

  return NextResponse.json({ ok: true, ...result });
}

function todayNow() {
  return new Date().toISOString().slice(0, 10);
}
