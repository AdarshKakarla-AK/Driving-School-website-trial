import { ExternalLink } from "lucide-react";

export function MapEmbed({ query, title = "Sri Mathru Driving School" }: { query: string; title?: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink-100 shadow-sm lg:aspect-[21/9]">
      <iframe src={src} title={title} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className="h-full w-full border-0" />
      <a
        href={dir}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-night-950/90 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <ExternalLink className="size-3.5" /> Get Directions
      </a>
    </div>
  );
}
