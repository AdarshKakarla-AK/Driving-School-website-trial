import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDB();
  const instructors = db.users.filter((u) => u.role === "instructor" && u.active).map((u) => {
    const { passwordHash, ...safe } = u as typeof u & { passwordHash?: string };
    return safe;
  });
  return NextResponse.json({ instructors, vehicles: db.vehicles });
}
