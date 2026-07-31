import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";
import type { LessonNote } from "@/lib/db/types";

export const dynamic = "force-dynamic";

// Instructor writes a lesson note; student sees it and recommendations update
export async function POST(req: Request) {
  const user = await requireUser(["instructor", "admin"]);
  const { bookingId, note, recommendation, skillDeltas } = await req.json();
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const lessonNote: LessonNote = {
    id: uid("note"),
    bookingId,
    studentId: booking.studentId,
    instructorId: user.id,
    date: booking.date,
    note,
    recommendation,
    skillDeltas: skillDeltas ?? {},
  };

  const student = db.users.find((u) => u.id === booking.studentId);
  mutate((db) => {
    db.lessonNotes.push(lessonNote);
    db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "lesson_note_added", targetId: bookingId, createdAt: nowISO() });
    if (student) {
      notify(db, student, "lesson_reminder", "New Lesson Feedback 📝", `${user.name} added feedback for your ${booking.date} lesson: "${note}"`, { channels: ["app", "whatsapp"], meta: "/portal/dashboard?tab=notes" });
    }
  });
  return NextResponse.json({ ok: true, note: lessonNote });
}
