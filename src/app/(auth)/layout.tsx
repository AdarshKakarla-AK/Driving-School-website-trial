"use client";

import * as React from "react";
import Link from "next/link";
import { ToastProvider } from "@/lib/client";
import { LocaleProvider } from "@/lib/i18n";
import { Logo } from "@/components/site/Logo";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LocaleProvider>
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-night-950 px-4 py-12">
          <div className="bg-grid-dark absolute inset-0" />
          <div className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <LanguageToggle className="border-white/20 bg-white/10 text-white" />
            <ThemeToggle className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white" />
          </div>
          <div className="relative w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Link href="/">
                <Logo dark />
              </Link>
            </div>
            {children}
            <p className="mt-6 text-center text-xs text-white/40">
              © {new Date().getFullYear()} Sri Mathru Driving School ·{" "}
              <Link href="/" className="hover:text-brand-400">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </LocaleProvider>
    </ToastProvider>
  );
}
