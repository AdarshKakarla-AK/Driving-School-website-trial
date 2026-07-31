"use client";

import * as React from "react";
import { api, type ApiData } from "@/lib/client";
import { Hero } from "@/components/site/Hero";
import { Packages } from "@/components/site/Packages";
import { Instructors } from "@/components/site/Instructors";
import { Testimonials } from "@/components/site/Testimonials";
import { Process } from "@/components/site/Process";
import { FAQ } from "@/components/site/FAQ";
import { Contact } from "@/components/site/Contact";
import { Spinner } from "@/components/ui";

export default function Home() {
  const [data, setData] = React.useState<ApiData>(null);

  React.useEffect(() => {
    api("/api/public/site").then(setData).catch(() => {});
  }, []);

  return (
    <>
      <Hero stats={data?.stats} />
      {!data ? (
        <div className="flex justify-center py-24">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <Packages packages={data.packages} />
          <Instructors instructors={data.instructors} />
          <Testimonials reviews={data.reviews} />
          <Process />
          <FAQ />
          <Contact settings={data.settings} />
        </>
      )}
    </>
  );
}
