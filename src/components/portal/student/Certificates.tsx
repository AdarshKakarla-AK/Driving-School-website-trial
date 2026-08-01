"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { ApiData } from "@/lib/client";

export function Certificates({ data }: { data: ApiData }) {
  const certs = React.useMemo(() => data.certificates ?? [], [data]);
  const [qrs, setQrs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const c of certs) {
        const url = `${window.location.origin}/verify/${c.code}`;
        map[c.code] = await QRCode.toDataURL(url, { width: 128, margin: 1 });
      }
      setQrs(map);
    })();
  }, [certs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Certificates</h1>
        <p className="text-sm text-ink-500">QR-verified certificates generated automatically on course completion.</p>
      </div>

      {certs.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Award className="size-7" />
          </div>
          <h3 className="font-display mt-4 font-bold text-ink-900">No certificates yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            Complete all your course lessons and your certificate with a QR verification code will appear here automatically.
          </p>
        </Card>
      ) : (
        certs.map((c: ApiData) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
              <div className="rounded-2xl border border-ink-100 bg-card p-3">
                {qrs[c.code] ? <Image src={qrs[c.code]} alt="Verification QR" width={96} height={96} unoptimized className="size-24" /> : <div className="size-24 animate-pulse bg-ink-50" />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-bold text-ink-900">{c.package}</h3>
                  <Badge tone="green">
                    <ShieldCheck className="size-3" /> QR verified
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  Issued to <span className="font-semibold text-ink-800">{c.student}</span> on {formatDate(c.issuedAt)} · Signed by {c.signedBy}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-400">Code: {c.code}</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/verify/${c.code}`} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-4 text-sm font-semibold text-white hover:from-brand-300 hover:to-brand-500">
                    <Award className="size-4" /> View & Print
                  </Link>
                  <Link href={`/verify/${c.code}`} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50">
                    <ExternalLink className="size-4" /> Public link
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
