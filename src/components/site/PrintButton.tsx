"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-4 text-sm font-semibold text-white hover:from-brand-300 hover:to-brand-500"
    >
      <Printer className="size-4" /> Print certificate
    </button>
  );
}
