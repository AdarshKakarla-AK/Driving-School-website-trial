import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Sri Mathru Driving School | Premium Driving Lessons in Bengaluru",
  description:
    "Learn to drive with Sri Mathru Driving School — online booking, automatic & manual cars, certified instructors, RTO license assistance and real-time progress tracking.",
  keywords: ["driving school", "driving lessons", "Bengaluru", "license assistance", "automatic car course", "night driving course"],
  openGraph: {
    title: "Sri Mathru Driving School",
    description: "Learn. Drive. Win. Premium driving school with online booking and certified instructors.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
