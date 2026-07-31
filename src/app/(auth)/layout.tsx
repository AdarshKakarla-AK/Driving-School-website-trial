"use client";

import * as React from "react";
import Link from "next/link";
import { ToastProvider } from "@/lib/client";
import { Logo } from "@/components/site/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-12">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Logo dark />
            </Link>
          </div>
          {children}
          <p className="mt-6 text-center text-xs text-ink-500">
            © {new Date().getFullYear()} Sri Mathru Driving School ·{" "}
            <Link href="/" className="hover:text-brand-400">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </ToastProvider>
  );
}
