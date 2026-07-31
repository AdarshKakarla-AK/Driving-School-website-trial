import { NextResponse } from "next/server";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";
import { audit } from "@/lib/notify";
import { rateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

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
    const ip = clientIp(req);

    if (action === "send") {
      if (!identifier) return NextResponse.json({ error: "Enter your phone or email." }, { status: 400 });

      const perIp = rateLimit(`otp-send:${ip}`, { max: 10, windowMs: 15 * 60000 });
      if (!perIp.allowed) {
        mutate((d) => audit(d, `ip:${ip}`, "otp_send_rate_limited", undefined, `identifier=${identifier}`));
        return rateLimitedResponse(perIp.retryAfterSec);
      }
      const perId = rateLimit(`otp-send:${identifier}`, { max: 10, windowMs: 15 * 60000 });
      if (!perId.allowed) {
        mutate((d) => audit(d, `ip:${ip}`, "otp_send_rate_limited", undefined, `identifier=${identifier}`));
        return rateLimitedResponse(perId.retryAfterSec);
      }

      const code = genCode();
      mutate((db) => {
        db.otps = db.otps.filter((o) => o.identifier !== identifier);
        db.otps.push({ id: uid("otp"), identifier, code, purpose: "login", expiresAt: new Date(Date.now() + 10 * 60000).toISOString() });
        db.automationLogs.push({ id: uid("auto"), type: "otp", channel: identifier.includes("@") ? "email" : "sms", recipient: identifier, summary: `OTP sent: ${code}`, status: "simulated", createdAt: nowISO() });
        audit(db, `ip:${ip}`, "otp_sent", undefined, `identifier=${identifier}`);
      });
      return NextResponse.json({ ok: true, demo: db.settings.demoMode, demoCode: db.settings.demoMode ? code : undefined });
    }

    if (action === "verify") {
      if (!identifier || code === undefined) return NextResponse.json({ error: "Identifier and code are required." }, { status: 400 });

      const perId = rateLimit(`otp-verify:${identifier}`, { max: 10, windowMs: 15 * 60000 });
      if (!perId.allowed) {
        mutate((d) => audit(d, `ip:${ip}`, "otp_verify_rate_limited", undefined, `identifier=${identifier}`));
        return rateLimitedResponse(perId.retryAfterSec);
      }

      const otp = db.otps.find((o) => o.identifier === identifier);
      if (!otp || otp.code !== String(code)) {
        mutate((d) => audit(d, `ip:${ip}`, "otp_verify_failed", undefined, `identifier=${identifier}`));
        return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 401 });
      }
      if (new Date(otp.expiresAt).getTime() < Date.now()) {
        mutate((d) => audit(d, `ip:${ip}`, "otp_verify_failed", undefined, `identifier=${identifier} reason=expired`));
        return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 401 });
      }
      const user = db.users.find((u) => u.phone === identifier || u.email === identifier);
      mutate((db) => {
        db.otps = db.otps.filter((o) => o.identifier !== identifier);
        audit(db, user?.id ?? `ip:${ip}`, "otp_verified", user?.id, `identifier=${identifier}`);
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
