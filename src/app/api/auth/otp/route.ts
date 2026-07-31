import { NextResponse } from "next/server";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, identifier, code } = body;
    const db = getDB();

    if (action === "send") {
      if (!identifier) return NextResponse.json({ error: "Enter your phone or email." }, { status: 400 });
      const code = genCode();
      mutate((db) => {
        db.otps = db.otps.filter((o) => o.identifier !== identifier);
        db.otps.push({ id: uid("otp"), identifier, code, purpose: "login", expiresAt: new Date(Date.now() + 10 * 60000).toISOString() });
        db.automationLogs.push({ id: uid("auto"), type: "otp", channel: identifier.includes("@") ? "email" : "sms", recipient: identifier, summary: `OTP sent: ${code}`, status: "simulated", createdAt: nowISO() });
      });
      return NextResponse.json({ ok: true, demo: db.settings.demoMode, demoCode: db.settings.demoMode ? code : undefined });
    }

    if (action === "verify") {
      const otp = db.otps.find((o) => o.identifier === identifier);
      if (!otp || otp.code !== String(code)) {
        return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 401 });
      }
      if (new Date(otp.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 401 });
      }
      const user = db.users.find((u) => u.phone === identifier || u.email === identifier);
      mutate((db) => {
        db.otps = db.otps.filter((o) => o.identifier !== identifier);
      });
      if (user) {
        const res = NextResponse.json({ ok: true, redirect: user.role === "admin" ? "/portal/admin" : user.role === "instructor" ? "/portal/instructor" : "/portal/dashboard" });
        res.cookies.set(SESSION_KEY, createSessionToken(user), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
        return res;
      }
      return NextResponse.json({ ok: true, needsRegistration: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("OTP route error:", err);
    return NextResponse.json({ error: "OTP request failed." }, { status: 500 });
  }
}
