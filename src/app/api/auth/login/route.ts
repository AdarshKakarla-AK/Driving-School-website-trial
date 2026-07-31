import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDB, mutate } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";
import { audit } from "@/lib/notify";
import { rateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    const db = getDB();
    const ip = clientIp(req);

    const check = rateLimit(`login:${ip}`, { max: 30, windowMs: 15 * 60000 });
    if (!check.allowed) {
      mutate((d) => audit(d, `ip:${ip}`, "login_rate_limited"));
      return rateLimitedResponse(check.retryAfterSec);
    }

    const user = db.users.find((u) => (u.phone === identifier || u.email?.toLowerCase() === identifier?.toLowerCase()));
    if (!user || !user.passwordHash) {
      mutate((d) => audit(d, `ip:${ip}`, "login_failed", user?.id, `identifier=${identifier}`));
      return NextResponse.json({ error: "No account found with these credentials." }, { status: 401 });
    }
    if (!user.active) {
      mutate((d) => audit(d, user.id, "login_blocked", user.id, "reason=deactivated"));
      return NextResponse.json({ error: "Account is deactivated. Contact support." }, { status: 403 });
    }
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      mutate((d) => audit(d, user.id, "login_failed", user.id));
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    mutate((d) => audit(d, user.id, "login_success", user.id, `ip=${ip}`));

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
