"use client";

import { useEffect, useState } from "react";
import { LEVEL_MAX, LEVEL_MIN, bandForLevel, bandLabel } from "@/lib/adaptive";

export function LevelMeter({ level }: { level: number }) {
  const [w, setW] = useState(0);
  const pct = ((Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, level)) - LEVEL_MIN) / (LEVEL_MAX - LEVEL_MIN)) * 100;

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const ticks = [];
  for (let g = LEVEL_MIN; g <= LEVEL_MAX; g++) ticks.push(g);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-3xl font-extrabold">
          {level.toFixed(1)}
          <span className="ml-1 text-sm font-semibold text-ink-soft">reading level</span>
        </span>
        <span className="chip bg-primary-soft text-primary-700">{bandLabel(bandForLevel(level))}</span>
      </div>
      <div className="relative h-4 w-full rounded-pill bg-primary-soft">
        <div
          className="absolute inset-y-0 left-0 rounded-pill bg-gradient-to-r from-primary via-accent to-gold"
          style={{ width: `${w}%`, transition: "width 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <div
          className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-primary shadow-lift"
          style={{ left: `${w}%`, transition: "left 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between px-0.5 text-[11px] font-semibold text-ink-faint">
        {ticks.map((g) => (
          <span key={g}>{g}</span>
        ))}
      </div>
    </div>
  );
}
