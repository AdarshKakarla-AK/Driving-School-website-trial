import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db/store";
import { verifyPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await requireUser();
  const { paymentId, razorpayPaymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "paymentId required." }, { status: 400 });
  try {
    const { payment, invoice } = mutate((db) => verifyPayment(db, paymentId, razorpayPaymentId));
    return NextResponse.json({ ok: true, payment, invoice });
  } catch {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
