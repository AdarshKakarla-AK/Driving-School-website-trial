import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const db = getDB();
  const { passwordHash, ...safe } = user as typeof user & { passwordHash?: string };
  const pkg = db.packages.find((p) => p.id === user.packageId);
  return NextResponse.json({ user: { ...safe, packageName: pkg?.name } });
}
