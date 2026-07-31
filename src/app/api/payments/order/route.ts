import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db/store";
import { createOrder, applyCoupon, razorpayOrderId } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
