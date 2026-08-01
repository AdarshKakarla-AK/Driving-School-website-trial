import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB } from "@/lib/db/store";
import { renderInvoicePdf, invoicePdfData } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ invoiceNo: string }> }) {
  const user = await requireUser();
  const { invoiceNo } = await params;
  const db = getDB();
  const invoice = db.invoices.find((i) => i.number === invoiceNo);
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (user.role !== "admin" && invoice.studentId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const pdf = await renderInvoicePdf(invoicePdfData(db, invoice));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNo}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
