import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db/store";
import { createBooking } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const db = getDB();  const base = db.bookings.filter((b) => {
    if (user.role === "admin") return true;
    if (user.role === "instructor") return b.instructorId === user.id;
    return b.studentId === user.id;
  });

  const rows = base
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .map((b) => ({
      ...b,
      student: db.users.find((u) => u.id === b.studentId)?.name,
      studentPhone: db.users.find((u) => u.id === b.studentId)?.phone,
      instructor: db.users.find((u) => u.id === b.instructorId)?.name,
      vehicle: db.vehicles.find((v) => v.id === b.vehicleId)?.name,
      package: db.packages.find((p) => p.id === b.packageId)?.name,
    }));

  return NextResponse.json({ bookings: rows });
}

export async function POST(req: Request) {
  const user = await requireUser(["student"]);
  const body = await req.json();
  const { booking, error } = mutate((db) => createBooking(db, { studentId: user.id, ...body }));
  if (error) return NextResponse.json({ error }, { status: 409 });
  return NextResponse.json({ ok: true, booking });
}
