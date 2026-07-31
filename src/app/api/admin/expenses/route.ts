import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  return NextResponse.json({ expenses: [...db.expenses].sort((a, b) => b.date.localeCompare(a.date)) });
}

export async function POST(req: Request) {
  await requireUser(["admin"]);
  const { category, amount, note, date } = await req.json();
  if (!category || !amount) return NextResponse.json({ error: "Category and amount required." }, { status: 400 });
  mutate((db) => {
    db.expenses.push({ id: uid("exp"), category, amount: Number(amount), note, date: date ?? new Date().toISOString().slice(0, 10) });
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await requireUser(["admin"]);
  const { id } = await req.json();
  mutate((db) => {
    db.expenses = db.expenses.filter((e) => e.id !== id);
  });
  return NextResponse.json({ ok: true });
}
