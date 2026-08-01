import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import { makeSeed, seedIds, futureDate } from "../helpers/seed";
import {
  createOrder,
  verifyPayment,
  applyCoupon,
  paymentRemindersDue,
  razorpayOrderId,
  razorpayFetchPayment,
  razorpayVerifySignature,
  markPaymentFailed,
  handleRazorpayWebhook,
} from "@/lib/payments";
import { createBooking } from "@/lib/booking";

describe("payments", () => {
  beforeEach(() => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  it("createOrder creates a single payment in demo mode", () => {
    const db = makeSeed();
    const { payments, demo } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    expect(demo).toBe(true);
    expect(payments).toHaveLength(1);
    expect(db.payments).toHaveLength(1);
    expect(db.payments[0].status).toBe("pending");
    expect(db.payments[0].amount).toBe(12000);
  });

  it("createOrder creates an EMI schedule", () => {
    const db = makeSeed();
    const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi", plan: "emi" });
    expect(payments).toHaveLength(3);
    expect(payments[0].installment).toBe(1);
    expect(payments[0].amount).toBe(3000);
    expect(payments[1].installment).toBe(2);
    expect(payments[1].amount).toBe(3500);
  });

  it("verifyPayment marks a payment paid and generates an invoice", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    const { payments } = createOrder(db, { studentId: seedIds.student1, bookingId: booking!.id, method: "upi", amount: 1000 });

    const { invoice, payment } = verifyPayment(db, payments[0].id, "pay_rzp");
    expect(payment.status).toBe("paid");
    expect(payment.paidAmount).toBe(1000);
    expect(payment.razorpayPaymentId).toBe("pay_rzp");
    expect(invoice.total).toBe(1000);
    expect(db.invoices).toHaveLength(1);
    expect(db.bookings.find((b) => b.id === booking!.id)!.status).toBe("confirmed");
    expect(db.bookings.find((b) => b.id === booking!.id)!.paymentRef).toBe(payment.ref);
  });

  it("verifyPayment on an EMI installment does not generate an invoice", () => {
    const db = makeSeed();
    const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi", plan: "emi" });
    const { invoice } = verifyPayment(db, payments[0].id);
    expect(db.invoices).toHaveLength(0);
    expect(invoice).toBeUndefined();
  });

  it("applyCoupon applies a percent discount and increments uses", () => {
    const db = makeSeed();
    db.coupons.push({
      id: "c_1",
      code: "SAVE10",
      type: "percent",
      value: 10,
      maxUses: 5,
      uses: 0,
      validFrom: "2020-01-01",
      validTo: "2999-12-31",
      active: true,
    });
    const { discount, final, error } = applyCoupon(db, "save10", 12000);
    expect(error).toBeUndefined();
    expect(discount).toBe(1200);
    expect(final).toBe(10800);
    expect(db.coupons[0].uses).toBe(1);
  });

  it("applyCoupon rejects an invalid or expired coupon", () => {
    const db = makeSeed();
    db.coupons.push({
      id: "c_2",
      code: "FLAT",
      type: "flat",
      value: 2000,
      maxUses: 5,
      uses: 5,
      validFrom: "2020-01-01",
      validTo: "2999-12-31",
      active: true,
    });
    expect(applyCoupon(db, "NOPE", 1000).error).toBe("Invalid coupon code.");
    expect(applyCoupon(db, "FLAT", 1000).error).toBe("Coupon expired or fully used.");
  });

  it("paymentRemindersDue returns only overdue pending payments", () => {
    const db = makeSeed();
    const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi", plan: "emi" });
    const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    const future = futureDate(10);
    db.payments[0].dueDate = past;
    db.payments[1].dueDate = future;
    const due = paymentRemindersDue(db);
    expect(due.map((p) => p.id)).toEqual([payments[0].id]);
  });

  it("applyCoupon applies a flat discount capped at the base amount", () => {
    const db = makeSeed();
    db.coupons.push({ id: "c_flat", code: "FLAT", type: "flat", value: 2000, maxUses: 5, uses: 0, validFrom: "2020-01-01", validTo: "2999-12-31", active: true });
    expect(applyCoupon(db, "FLAT", 1000)).toMatchObject({ discount: 1000, final: 0 });
  });

  it("applyCoupon rejects a coupon outside its validity window", () => {
    const db = makeSeed();
    db.coupons.push({ id: "c_future", code: "FUTURE", type: "percent", value: 10, maxUses: 5, uses: 0, validFrom: "2999-01-01", validTo: "2999-12-31", active: true });
    expect(applyCoupon(db, "FUTURE", 1000).error).toBe("Coupon is not valid right now.");
  });

  it("createOrder throws for an unknown student", () => {
    expect(() => createOrder(makeSeed(), { studentId: "nope", method: "upi" })).toThrow("STUDENT_NOT_FOUND");
  });

  it("verifyPayment throws for an unknown payment", () => {
    expect(() => verifyPayment(makeSeed(), "nope")).toThrow("PAYMENT_NOT_FOUND");
  });

  it("razorpayOrderId returns null without credentials", async () => {
    expect(await razorpayOrderId(1000, "rcpt")).toBeNull();
  });

  it("razorpayOrderId calls Razorpay with credentials and returns the id", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ id: "order_demo" }) });
    vi.stubGlobal("fetch", fetchMock);
    try {
      const id = await razorpayOrderId(12000, "rcpt_1");
      expect(id).toBe("order_demo");
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.razorpay.com/v1/orders");
      expect((opts.headers as Record<string, string>).Authorization).toBe(
        "Basic " + Buffer.from("rzp_test:secret").toString("base64")
      );
      expect(JSON.parse(opts.body as string).amount).toBe(1200000);
    } finally {
      vi.unstubAllGlobals();
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
    }
  });

  it("razorpayOrderId swallows provider errors", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    try {
      expect(await razorpayOrderId(1000, "rcpt")).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
    }
  });

  it("razorpayVerifySignature accepts a valid HMAC and rejects others", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const sig = createHmac("sha256", "wh-secret").update(payload).digest("hex");
    expect(razorpayVerifySignature(payload, sig, "wh-secret")).toBe(true);
    expect(razorpayVerifySignature(payload, "deadbeef", "wh-secret")).toBe(false);
    expect(razorpayVerifySignature(payload, sig, "other-secret")).toBe(false);
    expect(razorpayVerifySignature(payload, "", "wh-secret")).toBe(false);
    expect(razorpayVerifySignature("", sig, "wh-secret")).toBe(false);
  });

  it("razorpayFetchPayment returns null without credentials", async () => {
    expect(await razorpayFetchPayment("pay_1")).toBeNull();
  });

  it("razorpayFetchPayment calls Razorpay and returns capture state", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "pay_rzp", status: "captured", captured: true }) });
    vi.stubGlobal("fetch", fetchMock);
    try {
      const pay = await razorpayFetchPayment("pay_rzp");
      expect(pay).toEqual({ id: "pay_rzp", status: "captured", captured: true });
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.razorpay.com/v1/payments/pay_rzp");
      expect((opts.headers as Record<string, string>).Authorization).toBe(
        "Basic " + Buffer.from("rzp_test:secret").toString("base64")
      );
    } finally {
      vi.unstubAllGlobals();
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
    }
  });

  it("razorpayFetchPayment returns null on provider failure", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    try {
      expect(await razorpayFetchPayment("pay_rzp")).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
    }
  });

  it("markPaymentFailed sets a pending payment to failed", () => {
    const db = makeSeed();
    const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    markPaymentFailed(db, payments[0].id);
    expect(db.payments[0].status).toBe("failed");
    expect(() => markPaymentFailed(db, "nope")).toThrow("PAYMENT_NOT_FOUND");
  });

  it("handleRazorpayWebhook marks a payment paid on payment.captured", () => {
    const db = makeSeed();
    const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    db.payments[0].razorpayOrderId = "order_wh";

    const result = handleRazorpayWebhook(db, {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_wh", order_id: "order_wh", status: "captured" } } },
    });
    expect(result).toMatchObject({ event: "payment.captured", applied: true, paymentId: payments[0].id });
    expect(db.payments[0].status).toBe("paid");
    expect(db.payments[0].razorpayPaymentId).toBe("pay_wh");
    expect(db.invoices).toHaveLength(1);
  });

  it("handleRazorpayWebhook marks a payment paid on order.paid", () => {
    const db = makeSeed();
    createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    db.payments[0].razorpayOrderId = "order_wh";

    const result = handleRazorpayWebhook(db, {
      event: "order.paid",
      payload: { order: { entity: { id: "order_wh", amount: 1200000 } } },
    });
    expect(result.applied).toBe(true);
    expect(db.payments[0].status).toBe("paid");
  });

  it("handleRazorpayWebhook marks a payment failed on payment.failed", () => {
    const db = makeSeed();
    createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    db.payments[0].razorpayOrderId = "order_wh";

    const result = handleRazorpayWebhook(db, {
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_wh", order_id: "order_wh", status: "failed" } } },
    });
    expect(result.applied).toBe(true);
    expect(db.payments[0].status).toBe("failed");
    expect(db.invoices).toHaveLength(0);
  });

  it("handleRazorpayWebhook is idempotent and ignores unknown events", () => {
    const db = makeSeed();
    createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi" });
    db.payments[0].razorpayOrderId = "order_wh";

    expect(
      handleRazorpayWebhook(db, { event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_wh" } } } }).applied
    ).toBe(true);
    const paid = db.payments[0].id;
    expect(handleRazorpayWebhook(db, { event: "payment.captured", payload: { payment: { entity: { id: "pay_2", order_id: "order_wh" } } } }).applied).toBe(false);
    expect(db.payments.find((p) => p.id === paid)!.razorpayPaymentId).toBe("pay_1");
    expect(handleRazorpayWebhook(db, { event: "refund.processed", payload: {} }).applied).toBe(false);
    expect(handleRazorpayWebhook(db, { event: "payment.captured", payload: { payment: { entity: { id: "pay_3", order_id: "unknown_order" } } } }).applied).toBe(false);
  });
});
