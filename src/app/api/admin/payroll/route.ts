import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  const payroll = db.payroll.map((p) => ({
    ...p,
    instructor: db.users.find((u) => u.id === p.instructorId)?.name,
  }));
  return NextResponse.json({ payroll, instructors: db.users.filter((u) => u.role === "instructor") });
}

export async function POST(req: Request) {
  await requireUser(["admin"]);
  const { instructorId, month, lessons, base, bonus, commission, status } = await req.json();
  const total = (Number(base) || 0) + (Number(bonus) || 0) + (Number(commission) || 0);
  mutate((db) => {
    const existing = db.payroll.find((p) => p.instructorId === instructorId && p.month === month);
    if (existing) {
      existing.lessons = Number(lessons);
      existing.base = Number(base);
      existing.bonus = Number(bonus);
      existing.commission = Number(commission);
      existing.total = total;
      existing.status = status;
    } else {
      db.payroll.push({ id: uid("payroll"), instructorId, month, lessons: Number(lessons), base: Number(base), bonus: Number(bonus), commission: Number(commission), total, status: status ?? "pending", createdAt: nowISO() });
    }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await requireUser(["admin"]);
  const { id } = await req.json();
  mutate((db) => {
    db.payroll = db.payroll.filter((p) => p.id !== id);
  });
  return NextResponse.json({ ok: true });
}
