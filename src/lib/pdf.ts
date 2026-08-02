import "server-only";
import PDFDocument from "pdfkit";
import type { DB, Invoice } from "./db/types";
import type { WeeklyReport } from "./weekly";
import { formatINR } from "./utils";

export interface InvoicePdfData {
  schoolName: string;
  gstin: string;
  address: string;
  student: { name: string; email: string; phone: string; code?: string };
  payment: { ref: string; method: string; date: string };
  invoice: Invoice;
}

const BRAND = "#D97706";
const INK = "#1C1917";
const MUTED = "#78716C";
const LINE = "#E7E5E4";

export function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // Header band
    doc.rect(margin, 40, contentWidth, 6).fill(BRAND);
    y = 64;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(data.schoolName, margin, y, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(data.address, margin, y + 26, { width: contentWidth / 2, lineGap: 2 });

    doc.font("Helvetica-Bold").fontSize(14).fillColor(INK).text("TAX INVOICE", margin, y, { align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
      `Invoice ${data.invoice.number}\nIssued ${new Date(data.invoice.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      margin,
      y + 18,
      { align: "right", lineGap: 2 }
    );
    if (data.gstin) {
      doc.text(`GSTIN ${data.gstin}`, margin, y + 18 + 30, { align: "right" });
    }

    // Bill to
    y = 150;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("BILL TO", margin, y);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(data.student.name, margin, y + 14);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
      [data.student.email, data.student.phone, data.student.code ? `Student ID ${data.student.code}` : ""].filter(Boolean).join("\n"),
      margin,
      y + 30,
      { lineGap: 2 }
    );

    // Items table
    y = 250;
    const colX = { name: margin, qty: 380, amount: pageWidth - margin };
    doc.rect(margin, y - 6, contentWidth, 24).fill("#FAFAF9");
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.5);
    doc.text("DESCRIPTION", colX.name, y, { width: 200 });
    doc.text("QTY", colX.qty, y, { width: 60, align: "right" });
    doc.text("AMOUNT", colX.amount, y, { width: 110, align: "right" });
    y += 18 + 14;

    for (const item of data.invoice.items) {
      doc.fillColor(INK).font("Helvetica").fontSize(10);
      doc.text(item.name, colX.name, y, { width: 250 });
      doc.text(String(item.qty), colX.qty, y, { width: 60, align: "right" });
      doc.text(formatINR(item.amount), colX.amount, y, { width: 110, align: "right" });
      y += 18;
    }
    doc.moveTo(margin, y + 2).lineTo(pageWidth - margin, y + 2).strokeColor(LINE).lineWidth(1).stroke();
    y += 14;

    const totals: [string, string][] = [
      ["Subtotal", formatINR(data.invoice.subtotal)],
      [`GST (${data.invoice.gst > 0 ? "18%" : "—"})`, formatINR(data.invoice.gst)],
    ];
    for (const [label, value] of totals) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(label, colX.name, y, { width: 200 });
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(value, colX.amount, y, { width: 110, align: "right" });
      y += 18;
    }
    doc.rect(margin, y - 4, contentWidth, 26).fill("#FFFBEB");
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Total", margin, y, { width: 200 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(formatINR(data.invoice.total), colX.amount, y, { width: 110, align: "right" });
    y += 30;

    // Payment info
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("PAYMENT", margin, y);
    doc.fillColor(INK).font("Helvetica").fontSize(9.5).text(
      [
        `Method  ${data.payment.method.toUpperCase()}`,
        `Reference  ${data.payment.ref}`,
        `Paid on  ${data.payment.date}`,
      ].join("\n"),
      margin,
      y + 14,
      { lineGap: 3 }
    );

    // Footer
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(
      `Thank you for choosing ${data.schoolName}. This is a computer-generated invoice and requires no signature.`,
      margin,
      doc.page.height - 64,
      { width: contentWidth, align: "center" }
    );

    doc.end();
  });
}

export function renderWeeklyReportPdf(data: { schoolName: string; report: WeeklyReport }): Promise<Buffer> {
  const { schoolName, report } = data;
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    doc.rect(margin, 40, contentWidth, 6).fill(BRAND);
    y = 64;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(schoolName, margin, y, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("Weekly report", margin, y + 26, { width: contentWidth / 2, lineGap: 2 });

    doc.font("Helvetica-Bold").fontSize(14).fillColor(INK).text("WEEKLY REPORT", margin, y, { align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
      `${report.current.start} to ${report.current.end}`,
      margin,
      y + 18,
      { align: "right" }
    );

    y = 120;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("METRICS (THIS WEEK VS LAST WEEK)", margin, y);
    y += 24;

    const colX = { label: margin, cur: 380, prev: pageWidth - margin - 240, delta: pageWidth - margin };
    doc.rect(margin, y - 6, contentWidth, 22).fill("#FAFAF9");
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.5);
    doc.text("METRIC", colX.label, y, { width: 220 });
    doc.text("THIS WEEK", colX.cur, y, { width: 100, align: "right" });
    doc.text("LAST WEEK", colX.prev, y, { width: 110, align: "right" });
    doc.text("CHANGE", colX.delta, y, { width: 110, align: "right" });
    y += 18 + 10;

    for (const m of report.metrics) {
      const fmt = (n: number, suffix?: string) => (suffix === "INR" ? formatINR(n) : suffix === "%" ? `${n}%` : String(n));
      const change = m.delta === null ? "—" : `${m.delta > 0 ? "+" : ""}${m.delta}%`;
      doc.fillColor(INK).font("Helvetica").fontSize(10);
      doc.text(m.label, colX.label, y, { width: 220 });
      doc.text(fmt(m.thisWeek, m.suffix), colX.cur, y, { width: 100, align: "right" });
      doc.text(fmt(m.lastWeek, m.suffix), colX.prev, y, { width: 110, align: "right" });
      doc.fillColor(m.delta !== null && m.delta < 0 ? "#DC2626" : "#16A34A").font("Helvetica-Bold").fontSize(10);
      doc.text(change, colX.delta, y, { width: 110, align: "right" });
      doc.fillColor(INK);
      y += 18;
    }

    if (report.topInstructor || report.pipelineNext7 > 0) {
      y += 14;
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("HIGHLIGHTS", margin, y);
      y += 16;
      doc.fillColor(INK).font("Helvetica").fontSize(10).text(
        [
          report.topInstructor ? `Top instructor: ${report.topInstructor.name} (${report.topInstructor.lessons} lessons)` : "",
          `Upcoming in the next 7 days: ${report.pipelineNext7} lessons`,
        ].filter(Boolean).join("\n"),
        margin,
        y,
        { lineGap: 4 }
      );
    }

    y = Math.max(y + 24, doc.page.height - 200);
    const chartHeight = 110;
    const max = Math.max(1, ...report.revenueByDay.map((d) => d.revenue));
    const barWidth = (contentWidth - (report.revenueByDay.length - 1) * 4) / report.revenueByDay.length;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("DAILY REVENUE", margin, y - 16);
    y += 8;
    doc.rect(margin, y - 4, contentWidth, 1).fill(LINE);
    report.revenueByDay.forEach((d, i) => {
      const h = d.revenue > 0 ? Math.max(6, (d.revenue / max) * chartHeight) : 2;
      const x = margin + i * (barWidth + 4);
      doc.rect(x, y + chartHeight - h, barWidth, h).fill(d.revenue > 0 ? BRAND : "#E7E5E4");
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(d.label, x, y + chartHeight + 4, { width: barWidth, align: "center" });
    });

    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(
      `Generated for ${schoolName} on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
      margin,
      doc.page.height - 40,
      { width: contentWidth, align: "center" }
    );

    doc.end();
  });
}

export function invoicePdfData(db: DB, invoice: Invoice): InvoicePdfData {
  const student = db.users.find((u) => u.id === invoice.studentId);
  const payment = db.payments.find((p) => p.id === invoice.paymentId);
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");
  return {
    schoolName: db.settings.schoolName,
    gstin: db.settings.gstin,
    address: db.settings.address,
    student: { name: student.name ?? "", email: student.email ?? "", phone: student.phone ?? "", code: student.studentId },
    payment: {
      ref: payment.ref,
      method: payment.method,
      date: new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    },
    invoice,
  };
}
