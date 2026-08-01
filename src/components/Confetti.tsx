"use client";

import * as React from "react";

const COLORS = ["#fbbf24", "#f59e0b", "#34d399", "#38bdf8", "#f472b6", "#a78bfa"];

function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function Confetti({ count = 30 }: { count?: number }) {
  const pieces = React.useMemo(() => {
    const rand = seededRandom(count * 2654435761);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      delay: rand() * 1.2,
      duration: 2.4 + rand() * 1.8,
      size: 6 + rand() * 6,
      color: COLORS[i % COLORS.length],
      rot: 360 + Math.round(rand() * 540),
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: Math.round(p.size * 0.5),
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--confetti-rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
