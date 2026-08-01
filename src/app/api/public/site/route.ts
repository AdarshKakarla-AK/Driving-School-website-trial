import { NextResponse } from "next/server";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDB();
  const packages = db.packages.filter((p) => p.active !== false);
  const instructors = db.users
    .filter((u) => u.role === "instructor" && u.active)
    .map((u) => {
      const { passwordHash, ...safe } = u as typeof u & { passwordHash?: string };
      return safe;
    });
  const reviews = db.reviews
    .filter((r) => !r.private)
    .map((r) => ({ ...r, student: db.users.find((u) => u.id === r.studentId)?.name ?? "Student" }))
    .slice(-6)
    .reverse();
  const stats = {
    students: db.users.filter((u) => u.role === "student").length,
    instructors: db.users.filter((u) => u.role === "instructor").length,
    lessonsCompleted: db.bookings.filter((b) => b.status === "completed").length,
    rating: db.reviews.length ? (db.reviews.reduce((a, r) => a + r.rating, 0) / db.reviews.length) : 5,
  };
  return NextResponse.json({ packages, instructors, reviews, stats, settings: db.settings });
}

export async function POST(req: Request) {
  const { name, phone, email, message, source = "website" } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  mutate((db) => {
    db.leads.push({ id: uid("lead"), name, phone, email, source, status: "new", followUpAt: new Date(Date.now() + 86400000).toISOString(), notes: [message ?? ""], createdAt: nowISO() });
  });
  return NextResponse.json({ ok: true, message: "Thanks! We'll call you within 24 hours." });
}
