import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db/store";
import { createOrder, applyCoupon, razorpayOrderId } from "@/lib/payments";
import { clientIp, rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`payments-order:${clientIp(req)}`, { max: 30, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitedResponse(limit);

  const user = await requireUser(["student"]);
  const body = await req.json();

  const { couponCode } = body;
  let discount = 0;
  if (couponCode && body.amount) {
    const res = mutate((db) => applyCoupon(db, couponCode, body.amount));
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    discount = res.discount;
  }

  const finalAmount = Math.max(0, (body.amount ?? 0) - discount);
  const { payments, demo } = mutate((db) =>
    createOrder(db, {
      studentId: user.id,
      bookingId: body.bookingId,
      packageId: body.packageId,
      method: body.method ?? "upi",
      amount: finalAmount,
      plan: body.plan,
    })
  );

  const payment = payments[0];
  const orderId = await razorpayOrderId(finalAmount, payment.ref);
  if (orderId) {
    mutate((db) => {
      const p = db.payments.find((x) => x.id === payment.id);
      if (p) p.razorpayOrderId = orderId;
    });
  }

  return NextResponse.json({
    ok: true,
    demo,
    payment,
    razorpayOrderId: orderId,
    keyId: process.env.RAZORPAY_KEY_ID,
    amountPaise: Math.round(finalAmount * 100),
    currency: "INR",
    discount,
  });
}
