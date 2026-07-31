import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDB, mutate, uid, today, nextCounter, nowISO } from "@/lib/db/store";
import { createSessionToken } from "@/lib/auth";
import { notify } from "@/lib/notify";
import type { User } from "@/lib/db/types";

const SESSION_KEY = "smds_session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, password, age, gender, city, vehiclePreference, batchPreference, packageId, source, referralCode } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Name, phone and password are required." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const db = getDB();
    const existing = db.users.find((u) => u.phone === phone || (email && u.email === email));
    if (existing) {
      return NextResponse.json({ error: "An account with this phone/email already exists. Please login." }, { status: 409 });
    }

    const studentNo = nextCounter(db, "student");
    const pkg = db.packages.find((p) => p.id === packageId);

    let user: User;
    mutate((db) => {
      user = {
        id: uid("usr"),
        name,
        email,
        phone,
        passwordHash: bcrypt.hashSync(password, 10),
        role: "student",
        verified: true,
        active: true,
        studentId: `SMD${String(1000 + studentNo)}`,
        age: Number(age) || undefined,
        gender,
        city,
        vehiclePreference,
        batchPreference,
        packageId,
        enrolledAt: today(),
        referralCode: `SM${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        referredBy: referralCode,
        documents: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      db.users.push(user);
      db.auditLogs.push({ id: uid("audit"), actorId: user.id, action: "student_registered", targetId: user.id, meta: `Package: ${pkg?.name ?? "-"}`, createdAt: nowISO() });

      // link lead if exists
      const lead = db.leads.find((l) => l.phone === phone);
      if (lead) {
        lead.studentId = user.id;
        lead.status = "registered";
        lead.followUpAt = undefined;
      } else {
        db.leads.push({ id: uid("lead"), name, phone, email, source: source ?? "website", status: "registered", packageInterested: pkg?.name, studentId: user.id, notes: ["Self-registered via website"], createdAt: nowISO() });
      }
      notify(db, user, "welcome", `Welcome to ${db.settings.schoolName}! 🚗`, `Hi ${name}, your account is ready. Student ID: ${user.studentId}. ${pkg ? `You're enrolled in ${pkg.name}.` : ""} Check your dashboard to book your first lesson.`, { channels: ["app", "whatsapp", "email"], meta: "/portal/dashboard" });
    });

    const res = NextResponse.json({ ok: true, user: safeUser(user!), redirect: "/portal/dashboard" });
    res.cookies.set(SESSION_KEY, createSessionToken(user!), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

export function safeUser(u: User) {
  const { passwordHash, ...rest } = u as User & { passwordHash?: string };
  return rest;
}
