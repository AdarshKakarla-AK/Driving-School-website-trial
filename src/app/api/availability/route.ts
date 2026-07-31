import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/store";
import { getAvailability } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get("instructorId") ?? undefined;
  const vehicleType = searchParams.get("vehicleType") ?? undefined;
  const days = Number(searchParams.get("days") ?? 14);
  return NextResponse.json({ days: getAvailability(getDB(), instructorId, vehicleType, days) });
}
