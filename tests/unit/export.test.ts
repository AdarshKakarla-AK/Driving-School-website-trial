import { describe, it, expect } from "vitest";
import { csvEscape, toCsv, financeExport, studentsExport, payrollExport, exportCsv } from "@/lib/export";
import { makeSeed, seedIds } from "../helpers/seed";
import type { DB } from "@/lib/db/types";

function dbWithData(): DB {
  const db = makeSeed();
  db.payments.push({
    id: "pay_x",
    ref: "TXN99",
    studentId: seedIds.student1,
    amount: 12000,
    paidAmount: 12000,
    method: "upi",
    status: "paid",
    invoiceNo: "INV-1",
    createdAt: "2026-07-01T00:00:00.000Z",
  });
  db.payments.push({
    id: "pay_y",
    ref: "TXN100",
    studentId: seedIds.student1,
    amount: 3500,
    paidAmount: 0,
    method: "emi",
    status: "pending",
    installment: 2,
    dueDate: "2026-07-15",
    createdAt: "2026-07-02T00:00:00.000Z",
  });
  db.payroll.push({
    id: "pr_1",
    instructorId: seedIds.instructor,
    month: "2026-07",
    lessons: 20,
    base: 7000,
    bonus: 500,
    commission: 1000,
    total: 8500,
    status: "pending",
    createdAt: "2026-07-28T00:00:00.000Z",
  });
  return db;
}

describe("csv helpers", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape('has "quotes"')).toBe('"has ""quotes"""');
    expect(csvEscape("comma, here")).toBe('"comma, here"');
    expect(csvEscape(123)).toBe("123");
    expect(csvEscape(undefined)).toBe("");
  });

  it("joins rows with CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, "x,y"], [2, "z"]]);
    expect(csv).toBe("a,b\r\n1,\"x,y\"\r\n2,z");
  });
});

describe("financeExport", () => {
  it("emits a header and all payments, newest first", () => {
    const csv = financeExport(dbWithData());
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Ref,Student,Amount,Paid,Status,Method,Installment,Invoice,Due Date,Created At");
    expect(csv).toContain("TXN99");
    expect(csv).toContain("TXN100");
    expect(csv).toContain("Arun");
    expect(lines.indexOf(lines.find((l) => l.startsWith("TXN100"))!)).toBeLessThan(lines.indexOf(lines.find((l) => l.startsWith("TXN99"))!));
  });
});

describe("studentsExport", () => {
  it("lists students with their details", () => {
    const csv = studentsExport(makeSeed());
    expect(csv).toContain("Student ID,Name,Phone");
    expect(csv).toContain("S001,Arun");
    expect(csv).toContain("S002,Bhavana");
  });
});

describe("payrollExport", () => {
  it("joins instructor names into payroll rows", () => {
    const csv = payrollExport(dbWithData());
    expect(csv).toContain("2026-07,Ravi Kumar,20,7000,500,1000,8500,pending");
  });
});

describe("exportCsv", () => {
  it("dispatches to the right exporter", () => {
    const db = makeSeed();
    expect(exportCsv(db, "finance")).toContain("Ref,Student");
    expect(exportCsv(db, "students")).toContain("Student ID,Name");
    expect(exportCsv(db, "payroll")).toContain("Month,Instructor");
  });

  it("throws for unknown types", () => {
    expect(() => exportCsv(makeSeed(), "nope")).toThrow();
  });
});
