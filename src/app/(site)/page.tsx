"use client";

import * as React from "react";
import { api, type ApiData } from "@/lib/client";
import { Hero } from "@/components/site/Hero";
import { SocialProof } from "@/components/site/SocialProof";
import { Packages } from "@/components/site/Packages";
import { Fleet } from "@/components/site/Fleet";
import { Instructors } from "@/components/site/Instructors";
import { Testimonials } from "@/components/site/Testimonials";
import { Process } from "@/components/site/Process";
import { FAQ } from "@/components/site/FAQ";
import { Contact } from "@/components/site/Contact";
import { FinalCTA } from "@/components/site/FinalCTA";
import { JsonLd } from "@/components/site/JsonLd";
import { Skeleton } from "@/components/ui";

export default function Home() {
  const [data, setData] = React.useState<ApiData>(null);

  React.useEffect(() => {
    api("/api/public/site").then(setData).catch(() => {});
  }, []);

  return (
    <>
      <Hero stats={data?.stats} />
      <SocialProof stats={data?.stats} />
      {!data ? (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-xl space-y-3 text-center">
            <Skeleton className="mx-auto h-4 w-40" />
            <Skeleton className="mx-auto h-8 w-72" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <JsonLd settings={data?.settings} instructors={data?.instructors} vehicles={data?.vehicles} />
          <Packages packages={data.packages} seats={data?.seats} />
          <Fleet vehicles={data.vehicles} />
          <Instructors instructors={data.instructors} />
          <Process />
          <Testimonials reviews={data.reviews} />
          <FAQ />
          <Contact settings={data.settings} />
          <FinalCTA />
        </>
      )}
    </>
  );
}
