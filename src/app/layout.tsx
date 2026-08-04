import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

// Apply the persisted theme class before React hydrates to avoid a flash.
const themeInit = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Sri Mathru Driving School | Premium Driving Lessons in Bengaluru",
    template: "%s | Sri Mathru Driving School",
  },
  description:
    "Learn to drive with Sri Mathru Driving School — online booking, automatic & manual cars, certified instructors, RTO license assistance and real-time progress tracking.",
  keywords: ["driving school", "driving lessons", "Bengaluru", "license assistance", "automatic car course", "night driving course"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sri Mathru Driving School",
    description: "Learn. Drive. Win. Premium driving school with online booking and certified instructors.",
    type: "website",
    siteName: "Sri Mathru Driving School",
    locale: "en_IN",
    url: siteUrl(),
  },
  twitter: {
    card: "summary",
    title: "Sri Mathru Driving School",
    description: "Premium driving school with online booking and certified instructors.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "DrivingSchool",
  name: "Sri Mathru Driving School",
  description: "Premium driving school in Bengaluru with online booking, certified instructors and RTO license assistance.",
  telephone: "+91 90000 00000",
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  priceRange: "₹₹",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
