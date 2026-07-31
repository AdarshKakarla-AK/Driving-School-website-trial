import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO, today } from "@/lib/db/store";
import type { VehicleStatus } from "@/lib/db/types";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  return NextResponse.json({ vehicles: db.vehicles });
}

export async function POST(req: Request) {
  const user = await requireUser(["admin"]);
  const { vehicleId, status, note, fuelLevel } = await req.json();
  const db = getDB();
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });

  mutate((db) => {
    const v = db.vehicles.find((x) => x.id === vehicleId)!;
    if (status) {
      v.status = status as VehicleStatus;
      if (status === "maintenance") v.notes = note ?? v.notes;
      if (status === "available") v.lastCleanedAt = today();
    }
    if (typeof fuelLevel === "number") v.fuelLevel = fuelLevel;
    db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "vehicle_updated", targetId: vehicleId, meta: status ?? "fuel", createdAt: nowISO() });
  });

  // maintenance triggers instructor + admin notifications
  if (status === "maintenance") {
    const affected = db.bookings.filter((b) => b.vehicleId === vehicleId && b.date >= today() && !["cancelled", "no_show"].includes(b.status));
    mutate((db) => {
      affected.slice(0, 3).forEach((b) => {
        const student = db.users.find((u) => u.id === b.studentId);
        if (student) notify(db, student, "vehicle_changed", "Vehicle Change ⚠️", `Your car for ${b.date} is in maintenance. We'll assign an equivalent car or reschedule free of charge.`, { channels: ["app", "whatsapp"] });
      });
    });
  }

  return NextResponse.json({ ok: true });
}
