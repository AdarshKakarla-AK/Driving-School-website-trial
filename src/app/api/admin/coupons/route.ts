import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser(["admin"]);
  const db = getDB();
  return NextResponse.json({ coupons: db.coupons });
}

export async function POST(req: Request) {
  await requireUser(["admin"]);
  const { code, type, value, maxUses, validFrom, validTo, active } = await req.json();
  if (!code || !type || !value) {
    return NextResponse.json({ error: "code, type and value are required." }, { status: 400 });
  }
  mutate((db) => {
    const existing = db.coupons.find((c) => c.code.toUpperCase() === String(code).toUpperCase());
    if (existing) {
      existing.active = active ?? existing.active;
    } else {
      db.coupons.push({
        id: uid("cpn"),
        code: String(code).toUpperCase(),
        type: type === "flat" ? "flat" : "percent",
        value: Number(value),
        maxUses: Number(maxUses) || 1,
        uses: 0,
        validFrom: validFrom ?? nowISO().slice(0, 10),
        validTo: validTo ?? "2999-12-31",
        active: active ?? true,
      });
    }
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  await requireUser(["admin"]);
  const { id, active } = await req.json();
  mutate((db) => {
    const coupon = db.coupons.find((c) => c.id === id);
    if (coupon) coupon.active = !!active;
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await requireUser(["admin"]);
  const { id } = await req.json();
  mutate((db) => {
    db.coupons = db.coupons.filter((c) => c.id !== id);
  });
  return NextResponse.json({ ok: true });
}
