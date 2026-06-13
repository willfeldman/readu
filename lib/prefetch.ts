"use client";

import type { PassageResponse, Profile } from "./types";
import { nextFocusSkills } from "./adaptive";
import { fetchPassage } from "./api";

/**
 * Client-side prefetch cache for the *next* practice passage. After a session
 * completes we kick off generation in the background (keyed to the reader's
 * updated level + focus skills), so the next "Start reading" is instant.
 */

interface Entry {
  key: string;
  promise: Promise<PassageResponse>;
}

let entry: Entry | null = null;

/** Cache key — invalidated when the level (0.5 buckets), focus, or interests change. */
function keyFor(profile: Profile): string {
  const levelBucket = Math.round(profile.level * 2) / 2;
  const focus = nextFocusSkills(profile).join(",");
  const interests = [...profile.interests].sort().join(",");
  return `${levelBucket}|${focus}|${interests}`;
}

export function prefetchNext(profile: Profile): void {
  const key = keyFor(profile);
  if (entry && entry.key === key) return; // already prefetching the right thing

  const promise = fetchPassage({
    interests: profile.interests,
    level: profile.level,
    focusSkills: nextFocusSkills(profile),
    mode: "practice",
    excludeTitles: profile.sessions.slice(0, 8).map((s) => s.passageTitle),
    readerName: profile.name,
  }).catch((e) => {
    if (entry && entry.key === key) entry = null; // drop a failed prefetch
    throw e;
  });

  entry = { key, promise };
}

/** Return a matching prefetched passage promise if one exists, consuming it. */
export function consumePrefetch(profile: Profile): Promise<PassageResponse> | null {
  if (entry && entry.key === keyFor(profile)) {
    const { promise } = entry;
    entry = null;
    return promise;
  }
  return null;
}

export function clearPrefetch(): void {
  entry = null;
}
