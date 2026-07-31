import { NextResponse } from "next/server";
import { getDB, mutate, nowISO } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";
import type { User } from "@/lib/db/types";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

// Demo quick access + simulated Google OAuth
export async function POST(req: Request) {
  const body = await req.json();
  const db = getDB();

  if (body.action === "google") {
    let user = db.users.find((u) => u.google);
    if (!user) {
      const base = db.users.find((u) => u.role === "student" && !!u.enrolledAt);
      if (!base) return NextResponse.json({ error: "No student to simulate." }, { status: 404 });
      user = {
        ...base,
        id: `usr_google_${Date.now().toString(36)}`,
        name: "Google Demo User",
        email: "google.demo@gmail.com",
        google: true,
        passwordHash: undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      mutate((db) => db.users.push(user!));
    }
    const res = NextResponse.json({ ok: true, name: user.name, redirect: "/portal/dashboard", simulated: true });
    res.cookies.set(SESSION_KEY, createSessionToken(user), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  let user: User | undefined;
  if (body.role === "admin") user = db.users.find((u) => u.role === "admin");
  else if (body.role === "instructor") user = db.users.find((u) => u.role === "instructor");
  else user = db.users.find((u) => u.role === "student" && !!u.enrolledAt);
  if (!user) return NextResponse.json({ error: "Demo account not found." }, { status: 404 });

  const redirect = body.role === "admin" ? "/portal/admin" : body.role === "instructor" ? "/portal/instructor" : "/portal/dashboard";
  const res = NextResponse.json({ ok: true, name: user.name, role: user.role, redirect });
  res.cookies.set(SESSION_KEY, createSessionToken(user), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
