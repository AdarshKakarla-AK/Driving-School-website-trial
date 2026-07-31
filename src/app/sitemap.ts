import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/instructors`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/book`, lastModified, changeFrequency: "daily", priority: 0.7 },
  ];
}
