import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/store";
import { requireUser } from "@/lib/auth";
import { weeklyReport } from "@/lib/weekly";
import { weeklyExport } from "@/lib/export";
import { renderWeeklyReportPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireUser(["admin"]);
  const url = new URL(req.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const format = url.searchParams.get("format") ?? "json";
  const db = getDB();

  try {
    if (format === "csv") {
      const csv = weeklyExport(db, offset);
      const week = weeklyReport(db, offset).current.start;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="weekly-report-${week}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "pdf") {
      const report = weeklyReport(db, offset);
      const pdf = await renderWeeklyReportPdf({ schoolName: db.settings.schoolName, report });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="weekly-report-${report.current.start}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ report: weeklyReport(db, offset) });
  } catch {
    return NextResponse.json({ error: "Could not build weekly report." }, { status: 400 });
  }
}
