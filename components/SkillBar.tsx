"use client";

import { useEffect, useState } from "react";
import type { SkillStat } from "@/lib/types";
import type { SkillMeta } from "@/lib/skills";
import { masteryLabel } from "@/lib/adaptive";
import { SkillIcon } from "./SkillIcon";

export function SkillBar({ skill, stat }: { skill: SkillMeta; stat: SkillStat }) {
  const [w, setW] = useState(0);
  const pct = Math.round(stat.mastery * 100);

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const untouched = stat.attempts === 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `${skill.color}1A`, color: skill.color }}
      >
        <SkillIcon name={skill.icon} size={20} strokeWidth={2.3} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{skill.label}</span>
          <span className="shrink-0 text-xs font-semibold text-ink-soft">
            {untouched ? "Not yet" : `${masteryLabel(stat.mastery)} · ${pct}%`}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-black/5">
          <div
            className="h-full rounded-pill"
            style={{
              width: `${untouched ? 0 : w}%`,
              backgroundColor: skill.color,
              transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
