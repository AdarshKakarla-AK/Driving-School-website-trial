import { NextResponse } from "next/server";
import { mutate } from "@/lib/db/store";
import { handleRazorpayWebhook, razorpayVerifySignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "RAZORPAY_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Empty body" }, { status: 400 });
  }

  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!razorpayVerifySignature(raw, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = mutate((db) => handleRazorpayWebhook(db, payload as Record<string, unknown>));
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, error: "Webhook handling failed" }, { status: 500 });
  }
}
