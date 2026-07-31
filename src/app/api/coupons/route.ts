import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db/store";
import { applyCoupon } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await requireUser(["student"]);
  const { code, amount } = await req.json();
  const res = mutate((db) => applyCoupon(db, code, amount ?? 0));
  return NextResponse.json(res);
}
