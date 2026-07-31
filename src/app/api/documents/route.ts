import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";
import type { DocType } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser(["student"]);
  const { type, fileName, number, expiry } = await req.json();
  mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    u.documents.push({ id: uid("doc"), type: type as DocType, fileName: fileName ?? `${type}.jpg`, number, expiry, uploadedAt: nowISO() });
    u.updatedAt = nowISO();
    if (expiry) {
      const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
      if (days < 45) {
        notify(db, user, "license_reminder", "Document Expiry Soon ⚠️", `${type} expires in ${Math.max(0, days)} days. Renew it to keep your classes on track.`, { channels: ["app", "whatsapp"] });
      }
    }
  });
  return NextResponse.json({ ok: true });
}
