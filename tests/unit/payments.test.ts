import { describe, it, expect, beforeEach } from "vitest";
import { makeSeed, seedIds, futureDate } from "../helpers/seed";
import { createOrder, verifyPayment, applyCoupon, paymentRemindersDue } from "@/lib/payments";
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
});
