import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const db = getDB();
  const certs = db.certificates.filter((c) => c.studentId === user.id).map((c) => ({
    ...c,
    package: db.packages.find((p) => p.id === c.packageId)?.name,
    student: db.users.find((u) => u.id === c.studentId)?.name,
  }));
  return NextResponse.json({ certificates: certs });
}

export async function POST(req: Request) {
  const { code } = await req.json();
  const db = getDB();
  const cert = db.certificates.find((c) => c.code === code);
  if (!cert) return NextResponse.json({ ok: false, error: "Invalid certificate code." }, { status: 404 });
  return NextResponse.json({
    ok: true,
    certificate: { ...cert, student: db.users.find((u) => u.id === cert.studentId)?.name, package: db.packages.find((p) => p.id === cert.packageId)?.name },
  });
}
