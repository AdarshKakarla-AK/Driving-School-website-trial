import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDB } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    const db = getDB();
    const user = db.users.find((u) => (u.phone === identifier || u.email?.toLowerCase() === identifier?.toLowerCase()));
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "No account found with these credentials." }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "Account is deactivated. Contact support." }, { status: 403 });
    }
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, redirect: portalFor(user.role) });
    res.cookies.set(SESSION_KEY, createSessionToken(user), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

export function portalFor(role: string): string {
  if (role === "admin") return "/portal/admin";
  if (role === "instructor") return "/portal/instructor";
  return "/portal/dashboard";
}
