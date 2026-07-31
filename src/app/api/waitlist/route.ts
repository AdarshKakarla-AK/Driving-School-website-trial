import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db/store";
import { joinWaitingList } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser(["student"]);
  const { instructorId, date, time } = await req.json();
  const db = getDB();
  const taken = db.bookings.find((b) => b.instructorId === instructorId && b.date === date && b.time === time && !["cancelled", "no_show"].includes(b.status));
  if (!taken) return NextResponse.json({ error: "This slot is actually free — book it directly!" }, { status: 409 });
  const entry = mutate((db) => joinWaitingList(db, user.id, instructorId, date, time));
  return NextResponse.json({ ok: true, entry });
}
