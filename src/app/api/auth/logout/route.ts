import { NextResponse } from "next/server";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_KEY);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_KEY);
  return res;
}
