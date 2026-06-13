import seed from "@/data/seed-passages.json";
import type { Passage, PassageSource, RawPassage } from "./types";
import { bandForLevel } from "./adaptive";

const LIBRARY = seed as unknown as RawPassage[];

export const LIBRARY_SIZE = LIBRARY.length;

let counter = 0;
function makeId(): string {
  counter += 1;
  return `p_${Date.now().toString(36)}_${counter.toString(36)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function toPassage(raw: RawPassage, source: PassageSource): Passage {
  return {
    id: makeId(),
    title: raw.title,
    summary: raw.summary,
    passage: raw.passage,
    interestId: raw.interestId,
    interestLabel: raw.interestLabel,
    band: raw.band,
    grade: raw.grade,
    questions: raw.questions,
    vocabulary: raw.vocabulary ?? [],
    source,
  };
}

export interface LibraryQuery {
  interests: string[];
  level: number;
  excludeTitles?: string[];
}

export function pickLibraryRaw(opts: LibraryQuery): RawPassage | null {
  if (LIBRARY.length === 0) return null;
  const band = bandForLevel(opts.level);
  const exclude = new Set(opts.excludeTitles ?? []);
  const interests = opts.interests.length ? opts.interests : LIBRARY.map((p) => p.interestId);
  const inInterest = LIBRARY.filter((p) => interests.includes(p.interestId));

  const fresh = (list: RawPassage[]) => {
    const f = list.filter((p) => !exclude.has(p.title));
    return f.length ? f : list;
  };

  // Priority tiers: matching interest + band → interest (any band) → band (any interest) → anything.
  const tiers = [
    inInterest.filter((p) => p.band === band),
    inInterest,
    LIBRARY.filter((p) => p.band === band),
    LIBRARY,
  ];
  for (const tier of tiers) {
    if (tier.length) return pick(fresh(tier));
  }
  return null;
}

export function getLibraryPassage(opts: LibraryQuery): Passage | null {
  const raw = pickLibraryRaw(opts);
  return raw ? toPassage(raw, "library") : null;
}
