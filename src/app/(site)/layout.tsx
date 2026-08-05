"use client";

import { ToastProvider } from "@/lib/client";
import { LocaleProvider } from "@/lib/i18n";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ChatWidget } from "@/components/site/ChatWidget";
import { StickyCTA } from "@/components/site/StickyCTA";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LocaleProvider>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatWidget />
        <StickyCTA />
      </LocaleProvider>
    </ToastProvider>
  );
}
