import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
