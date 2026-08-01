import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate } from "@/lib/db/store";
import { verifyPayment, razorpayFetchPayment } from "@/lib/payments";
import { clientIp, rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`payments-verify:${clientIp(req)}`, { max: 30, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitedResponse(limit);

  const user = await requireUser();
  const { paymentId, razorpayPaymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "paymentId required." }, { status: 400 });

  const db = getDB();
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (user.role !== "admin" && payment.studentId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (payment.status === "paid") {
    const invoice = db.invoices.find((i) => i.paymentId === paymentId) ?? null;
    return NextResponse.json({ ok: true, payment, invoice });
  }

  if (process.env.RAZORPAY_KEY_ID) {
    if (!razorpayPaymentId) {
      return NextResponse.json({ error: "razorpayPaymentId required." }, { status: 400 });
    }
    const rp = await razorpayFetchPayment(razorpayPaymentId);
    if (!rp) {
      return NextResponse.json({ error: "Could not confirm payment with Razorpay." }, { status: 502 });
    }
    if (!rp.captured || rp.status !== "captured") {
      return NextResponse.json({ error: "Payment not captured." }, { status: 400 });
    }
  }

  try {
    const { payment: verified, invoice } = mutate((db) => verifyPayment(db, paymentId, razorpayPaymentId));
    return NextResponse.json({ ok: true, payment: verified, invoice });
  } catch {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
