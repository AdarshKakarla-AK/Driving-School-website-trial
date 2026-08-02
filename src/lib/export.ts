import "server-only";
import type { DB } from "./db/types";
import { weeklyReport } from "./weekly";

export type ExportType = "finance" | "students" | "payroll" | "weekly";

export function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

export function financeExport(db: DB): string {
  const rows = db.payments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => {
      const student = db.users.find((u) => u.id === p.studentId);
      return [
        p.ref,
        student?.name ?? "",
        p.amount,
        p.paidAmount,
        p.status,
        p.method,
        p.installment ?? "",
        p.invoiceNo ?? "",
        p.dueDate ?? "",
        p.createdAt,
      ];
    });
  return toCsv(
    ["Ref", "Student", "Amount", "Paid", "Status", "Method", "Installment", "Invoice", "Due Date", "Created At"],
    rows
  );
}

export function studentsExport(db: DB): string {
  const rows = db.users
    .filter((u) => u.role === "student")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((u) => {
      const pkg = db.packages.find((p) => p.id === u.packageId);
      return [
        u.studentId ?? "",
        u.name,
        u.phone,
        u.email ?? "",
        u.city ?? "",
        u.age ?? "",
        u.gender ?? "",
        u.vehiclePreference ?? "",
        pkg?.name ?? "",
        u.referralCode ?? "",
        u.active ? "active" : "inactive",
        u.enrolledAt ?? "",
        u.createdAt,
      ];
    });
  return toCsv(
    ["Student ID", "Name", "Phone", "Email", "City", "Age", "Gender", "Vehicle", "Package", "Referral Code", "Status", "Enrolled At", "Created At"],
    rows
  );
}

export function payrollExport(db: DB): string {
  const rows = db.payroll
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const instructor = db.users.find((u) => u.id === r.instructorId);
      return [r.month, instructor?.name ?? "", r.lessons, r.base, r.bonus, r.commission, r.total, r.status, r.createdAt];
    });
  return toCsv(
    ["Month", "Instructor", "Lessons", "Base", "Bonus", "Commission", "Total", "Status", "Created At"],
    rows
  );
}

export function weeklyExport(db: DB, offsetWeeks = 0): string {
  const r = weeklyReport(db, offsetWeeks);
  const rows: unknown[][] = [];
  for (const m of r.metrics) {
    const change = m.delta === null ? "" : `${m.delta > 0 ? "+" : ""}${m.delta}%`;
    rows.push([m.label, m.thisWeek, m.lastWeek, change]);
  }
  rows.push(["Pipeline (next 7 days)", r.pipelineNext7, "", ""]);
  if (r.topInstructor) rows.push(["Top instructor", `${r.topInstructor.name} (${r.topInstructor.lessons} lessons)`, "", ""]);
  rows.push([]);
  rows.push(["Day", "Date", "Revenue", ""]);
  for (const d of r.revenueByDay) rows.push([d.label, d.date, d.revenue, ""]);
  return toCsv(["Metric", "This Week", "Last Week", "Change"], rows);
}

export function exportCsv(db: DB, type: string, offsetWeeks = 0): string {
  switch (type) {
    case "finance":
      return financeExport(db);
    case "students":
      return studentsExport(db);
    case "payroll":
      return payrollExport(db);
    case "weekly":
      return weeklyExport(db, offsetWeeks);
    default:
      throw new Error(`Unknown export type: ${type}`);
  }
}
