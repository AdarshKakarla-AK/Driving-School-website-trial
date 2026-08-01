import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { uid, nowISO, today, nextCounter } from "./db/store";
import { notify } from "./notify";
import { confirmBooking } from "./booking";
import { renderInvoicePdf, invoicePdfData } from "./pdf";
import type { Coupon, DB, Invoice, Payment, User } from "./db/types";
import type { ApiData } from "./client";

const toPaise = (amount: number) => Math.round(amount * 100);

export async function razorpayOrderId(amount: number, receipt: string): Promise<string | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({ amount: toPaise(amount), currency: "INR", receipt, payment_capture: 1 }),
    });
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function razorpayFetchPayment(paymentId: string): Promise<{ id: string; status: string; captured: boolean } | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !paymentId) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; status: string; captured?: boolean };
    return { id: data.id, status: data.status, captured: Boolean(data.captured) };
  } catch {
    return null;
  }
}

export function razorpayVerifySignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export interface CreateOrderInput {
  studentId: string;
  bookingId?: string;
  packageId?: string;
  method: Payment["method"];
  amount?: number;
  plan?: "full" | "emi";
}

export function createOrder(db: DB, input: CreateOrderInput): { payments: Payment[]; demo: boolean } {
  const student = db.users.find((u) => u.id === input.studentId);
  if (!student) throw new Error("STUDENT_NOT_FOUND");

  const pkg = db.packages.find((p) => p.id === input.packageId);
  const booking = db.bookings.find((b) => b.id === input.bookingId);

  const baseAmount = input.amount ?? booking?.amount ?? pkg?.price ?? 0;
  const demo = !process.env.RAZORPAY_KEY_ID;
  const payments: Payment[] = [];

  if (input.plan === "emi" && pkg?.emi) {
    const down: Payment = makePayment(student, pkg, booking, pkg.emi.downPayment, input.method, 1, demo);
    payments.push(down);
    for (let m = 2; m <= pkg.emi.months; m++) {
      payments.push(
        makePayment(student, pkg, booking, pkg.emi.monthly, "emi", m, demo, new Date(Date.now() + (m - 1) * 30 * 86400000).toISOString())
      );
    }
  } else {
    payments.push(makePayment(student, pkg, booking, baseAmount, input.method, undefined, demo));
  }

  db.payments.push(...payments);

  return { payments, demo };
}

function makePayment(student: User, pkg: ApiData, booking: ApiData, amount: number, method: Payment["method"], installment?: number, demo?: boolean, dueDate?: string): Payment {
  return {
    id: uid("pay"),
    ref: `TXN${Date.now().toString(36).toUpperCase()}`,
    studentId: student.id,
    bookingId: booking?.id,
    packageId: pkg?.id,
    amount,
    paidAmount: 0,
    method,
    status: "pending",
    installment,
    dueDate,
    createdAt: nowISO(),
  };
}

export function verifyPayment(db: DB, paymentId: string, razorpayPaymentId?: string): { payment: Payment; invoice: Invoice } {
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  const student = db.users.find((u) => u.id === payment.studentId);
  if (!student) throw new Error("STUDENT_NOT_FOUND");

  let invoice: Invoice | undefined;

  const pay = db.payments.find((p) => p.id === paymentId)!;
  pay.status = "paid";
  pay.paidAmount = pay.amount;
  if (razorpayPaymentId) pay.razorpayPaymentId = razorpayPaymentId;

  const studentInDb = db.users.find((u) => u.id === payment.studentId)!;
  const pkgInDb = db.packages.find((p) => p.id === payment.packageId);

  if (pay.bookingId) confirmBooking(db, pay.bookingId, pay.ref);

  if (!pay.invoiceNo && pay.installment === undefined) {
    const invNum = `INV-${new Date().getFullYear()}-${String(nextCounter(db, "invoice")).padStart(3, "0")}`;
    const subtotal = Math.round(pay.amount / 1.18);
    const gst = pay.amount - subtotal;
    const inv: Invoice = {
      id: uid("inv"),
      number: invNum,
      studentId: pay.studentId,
      paymentId: pay.id,
      items: [{ name: pkgInDb?.name ?? "Driving course", qty: 1, amount: subtotal }],
      subtotal,
      gst,
      total: pay.amount,
      issuedAt: nowISO(),
    };
    db.invoices.push(inv);
    pay.invoiceNo = invNum;
    invoice = inv;
    notify(db, studentInDb, "invoice", "Invoice Generated 🧾", `Invoice ${invNum} for ₹${pay.amount} is ready in your dashboard.`, { channels: ["app"], meta: "/portal/dashboard?tab=payments" });
    void emailInvoicePdf(db, inv, studentInDb);
    notify(db, studentInDb, "receipt", "Payment Receipt ✅", `We received your payment of ₹${pay.amount} (${pay.method.toUpperCase()}).`, { channels: ["app", "whatsapp", "email"] });
    db.automationLogs.push({ id: uid("auto"), type: "receipt", channel: "whatsapp", recipient: studentInDb.phone, summary: `Payment of ₹${pay.amount} confirmed`, status: "simulated", createdAt: nowISO() });
  } else if (pay.installment !== undefined) {
    notify(db, studentInDb, "receipt", `EMI Installment ${pay.installment} Paid ✅`, `₹${pay.amount} received. ${db.settings.schoolName} keeps you on track.`, { channels: ["app", "whatsapp"] });
  }

  // referrer bonus
  if (studentInDb.referredBy) {
    const referrer = db.users.find((u) => u.referralCode === studentInDb.referredBy);
    if (referrer && referrer.role === "student") {
      notify(db, referrer, "referral", "Referral Reward 🎁", `${studentInDb.name} joined using your code. You earned a ₹${db.settings.referralDiscount} credit on your next payment!`, { channels: ["app", "whatsapp"] });
    }
  }

  if (!invoice) {
    invoice = db.invoices.find((i) => i.paymentId === paymentId)!;
  }
  return { payment: db.payments.find((p) => p.id === paymentId)!, invoice };
}

export function applyCoupon(db: DB, code: string, baseAmount: number): { coupon?: Coupon; discount: number; final: number; error?: string } {
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return { discount: 0, final: baseAmount, error: "Invalid coupon code." };
  if (!coupon.active || coupon.uses >= coupon.maxUses) return { discount: 0, final: baseAmount, error: "Coupon expired or fully used." };
  const now = Date.now();
  if (now < new Date(coupon.validFrom).getTime() || now > new Date(coupon.validTo).getTime()) {
    return { discount: 0, final: baseAmount, error: "Coupon is not valid right now." };
  }
  const discount = coupon.type === "percent" ? Math.round((baseAmount * coupon.value) / 100) : Math.min(coupon.value, baseAmount);
  const c = db.coupons.find((x) => x.code.toUpperCase() === code.toUpperCase());
  if (c) c.uses += 1;
  return { coupon, discount, final: Math.max(0, baseAmount - discount) };
}

export function paymentRemindersDue(db: DB): Payment[] {
  const todayStr = today();
  return db.payments.filter((p) => p.status === "pending" && p.dueDate && p.dueDate <= todayStr);
}

async function emailInvoicePdf(db: DB, invoice: Invoice, student: User): Promise<void> {
  try {
    const pdf = await renderInvoicePdf(invoicePdfData(db, invoice));
    notify(db, student, "invoice", "Invoice Generated 🧾", `Invoice ${invoice.number} for ₹${invoice.total} is attached.`, {
      channels: ["email"],
      meta: "/portal/dashboard?tab=payments",
      attachments: [{ filename: `${invoice.number}.pdf`, contentType: "application/pdf", data: pdf.toString("base64") }],
    });
  } catch {
    // PDF emailing is best-effort and must never fail the payment.
  }
}

export function markPaymentFailed(db: DB, paymentId: string): Payment {
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");
  payment.status = "failed";
  return payment;
}

export interface RazorpayWebhookResult {
  event: string;
  applied: boolean;
  paymentId?: string;
}

export function handleRazorpayWebhook(db: DB, payload: ApiData): RazorpayWebhookResult {
  const event: string | undefined = payload?.event;
  const entity = payload?.payload?.payment?.entity ?? payload?.payload?.order?.entity;
  if (!event || !entity) return { event: event ?? "unknown", applied: false };

  if (event === "payment.captured" || event === "order.paid") {
    const orderId: string | undefined = entity.order_id ?? entity.id;
    const payment = orderId ? db.payments.find((p) => p.razorpayOrderId === orderId) : undefined;
    if (!payment || payment.status !== "pending") return { event, applied: false, paymentId: payment?.id };
    verifyPayment(db, payment.id, entity.id);
    return { event, applied: true, paymentId: payment.id };
  }

  if (event === "payment.failed") {
    const orderId: string | undefined = entity.order_id;
    const payment = orderId ? db.payments.find((p) => p.razorpayOrderId === orderId) : undefined;
    if (!payment || payment.status !== "pending") return { event, applied: false, paymentId: payment?.id };
    markPaymentFailed(db, payment.id);
    return { event, applied: true, paymentId: payment.id };
  }

  return { event, applied: false };
}
