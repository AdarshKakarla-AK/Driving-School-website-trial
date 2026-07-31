import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const db = getDB();
  const list = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  return NextResponse.json({ notifications: list, unread: list.filter((n) => !n.read).length });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const { id, all } = await req.json();
  mutate((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === user.id && (all || n.id === id)) n.read = true;
    });
  });
  return NextResponse.json({ ok: true });
}
