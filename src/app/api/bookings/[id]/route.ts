import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db/store";
import { cancelBooking, rescheduleBooking } from "@/lib/booking";
import { audit } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await req.json();
  const db = getDB();

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const owns = user.role === "admin" || booking.studentId === user.id || booking.instructorId === user.id;
  if (!owns) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (body.action === "cancel") {
    const { error, refund } = mutate((db) => {
      const r = cancelBooking(db, id, body.reason);
      audit(db, user.id, "booking_cancelled", id, `Refund ₹${r.refund ?? 0}`);
      return r;
    });
    if (error) return NextResponse.json({ error }, { status: 409 });
    return NextResponse.json({ ok: true, refund });
  }

  if (body.action === "reschedule") {
    const { booking: nb, error } = mutate((db) => {
      const r = rescheduleBooking(db, id, body.date, body.time);
      audit(db, user.id, "booking_rescheduled", id);
      return r;
    });
    if (error) return NextResponse.json({ error }, { status: 409 });
    return NextResponse.json({ ok: true, booking: nb });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
