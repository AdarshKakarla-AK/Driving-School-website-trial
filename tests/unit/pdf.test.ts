import { describe, it, expect } from "vitest";
import { makeSeed, seedIds } from "../helpers/seed";
import { createOrder, verifyPayment } from "@/lib/payments";
import { renderInvoicePdf, invoicePdfData, renderWeeklyReportPdf } from "@/lib/pdf";
import { weeklyReport } from "@/lib/weekly";
import type { DB } from "@/lib/db/types";

function paidInvoice(): { db: DB; invoiceId: string; invoiceNumber: string } {
  const db = makeSeed();
  const { payments } = createOrder(db, { studentId: seedIds.student1, packageId: seedIds.pkg, method: "upi", amount: 1180 });
  const { invoice } = verifyPayment(db, payments[0].id);
  return { db, invoiceId: invoice!.id, invoiceNumber: invoice!.number };
}

describe("pdf", () => {
  it("renders a valid PDF for an invoice", async () => {
    const { db, invoiceId } = paidInvoice();
    const invoice = db.invoices.find((i) => i.id === invoiceId)!;
    const pdf = await renderInvoicePdf(invoicePdfData(db, invoice));

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a structured single-page PDF with fonts and content streams", async () => {
    const { db, invoiceId } = paidInvoice();
    const invoice = db.invoices.find((i) => i.id === invoiceId)!;
    const pdf = await renderInvoicePdf(invoicePdfData(db, invoice));
    const body = pdf.toString("latin1");

    expect(body).toContain("%PDF-");
    expect(body).toContain("/Type /Page");
    expect(body).toContain("/Font");
    expect(body).toContain("stream");
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("invoicePdfData resolves student and payment details", () => {
    const { db, invoiceId } = paidInvoice();
    const invoice = db.invoices.find((i) => i.id === invoiceId)!;
    const data = invoicePdfData(db, invoice);
    const student = db.users.find((u) => u.id === invoice.studentId)!;

    expect(data.student.name).toBe(student.name);
    expect(data.payment.ref).toBeDefined();
    expect(data.gstin).toBeDefined();
  });

  it("invoicePdfData throws when the student or payment is missing", () => {
    const { db, invoiceId } = paidInvoice();
    const invoice = db.invoices.find((i) => i.id === invoiceId)!;
    expect(() => invoicePdfData({ ...db, users: [] }, invoice)).toThrow("STUDENT_NOT_FOUND");
    expect(() => invoicePdfData({ ...db, payments: [] }, invoice)).toThrow("PAYMENT_NOT_FOUND");
  });

  it("verifyPayment produces an invoice whose totals reconcile with its payment", () => {
    const { db, invoiceId } = paidInvoice();
    const invoice = db.invoices.find((i) => i.id === invoiceId)!;
    const payment = db.payments.find((p) => p.id === invoice.paymentId)!;
    expect(payment.invoiceNo).toBe(invoice.number);
    expect(invoice.total).toBe(payment.amount);
    expect(invoice.subtotal + invoice.gst).toBe(invoice.total);
  });

  it("renders a valid PDF for the weekly report", async () => {
    const db = makeSeed();
    const report = weeklyReport(db, 0);
    const pdf = await renderWeeklyReportPdf({ schoolName: db.settings.schoolName, report });

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("/Type /Page");
  });
});
