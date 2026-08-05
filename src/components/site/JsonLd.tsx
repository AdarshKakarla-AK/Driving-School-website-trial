import type { ApiData } from "@/lib/client";

export function JsonLd({ settings, instructors, vehicles }: { settings?: ApiData; instructors?: ApiData[]; vehicles?: ApiData[] }) {
  const schoolName = settings?.schoolName ?? "Sri Mathru Driving School";
  const graph: ApiData[] = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: schoolName,
      telephone: settings?.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings?.address,
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
      openingHours: settings?.openingHours,
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "200" },
      priceRange: "₹₹",
    },
    ...(vehicles ?? []).map((v) => ({
      "@type": "Vehicle",
      name: v.name,
      model: v.model,
      brand: String(v.model ?? v.name ?? "").split(" ")[0],
      category: "car",
      vehicleModelDescription: "Dual-control driving training car",
    })),
    ...(instructors ?? []).map((i) => ({
      "@type": "Person",
      name: i.name,
      jobTitle: "Driving Instructor",
      worksFor: schoolName,
      knowsAbout: i.specialization ?? [],
    })),
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
