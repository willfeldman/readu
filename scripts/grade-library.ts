/**
 * grade-library.ts — runs every passage in the content library through the
 * Opus 4.8 verifier against rubric.json and prints a scorecard.
 *
 *   npm run grade            # grade the whole library
 *   npm run grade -- --limit=8   # grade the first 8 (quick check)
 *
 * Requires ANTHROPIC_API_KEY (loaded from .env.local).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fall back to .env if present

import seed from "../data/seed-passages.json";
import { verifyPassage } from "../lib/verify";
import type { Passage, RawPassage, VerificationResult } from "../lib/types";

const RANGES: Record<string, { min: number; max: number }> = {
  emerging: { min: 190, max: 260 },
  growing: { min: 300, max: 410 },
  advanced: { min: 440, max: 560 },
};

const CONCURRENCY = 3;
const MAX_TRIES = 3;

interface Row {
  title: string;
  pass: boolean;
  failed: string[];
  errored: boolean;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("✖ ANTHROPIC_API_KEY not set — add it to .env.local. The grader needs Opus 4.8.");
    process.exit(1);
  }

  const library = seed as unknown as RawPassage[];
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : library.length;
  const items = library.slice(0, Math.max(0, limit));

  console.log(`Grading ${items.length} passages against rubric.json with Opus 4.8…\n`);

  const rows: Row[] = new Array(items.length);
  const tally: Record<string, { pass: number; total: number }> = {};
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      const raw = items[i];
      const passage = { ...raw, id: `lib_${i}`, source: "library" } as Passage;
      try {
        let v: VerificationResult | undefined;
        let lastErr: unknown;
        for (let t = 0; t < MAX_TRIES && !v; t++) {
          try {
            v = await verifyPassage(passage, { targetGrade: raw.grade, wordRange: RANGES[raw.band] });
          } catch (e) {
            lastErr = e;
          }
        }
        if (!v) throw lastErr;
        const failed = v.perCriterion.filter((c) => !c.pass).map((c) => c.id);
        rows[i] = { title: raw.title, pass: v.pass, failed, errored: false };
        for (const c of v.perCriterion) {
          tally[c.id] ??= { pass: 0, total: 0 };
          tally[c.id].total++;
          if (c.pass) tally[c.id].pass++;
        }
      } catch (e) {
        rows[i] = { title: raw.title, pass: false, failed: ["(grader error)"], errored: true };
        console.error(`  ! error grading "${raw.title}": ${e instanceof Error ? e.message : String(e)}`);
      }
      const r = rows[i];
      console.log(
        `${r.pass ? "✓" : "✗"} [G${raw.grade}] ${raw.title}${r.pass ? "" : `  — failed: ${r.failed.join(", ")}`}`,
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));

  const passed = rows.filter((r) => r.pass).length;
  const pct = items.length ? Math.round((passed / items.length) * 100) : 0;

  console.log("\n— Per-criterion pass rate —");
  for (const [id, t] of Object.entries(tally).sort((a, b) => a[0].localeCompare(b[0]))) {
    const cp = t.total ? Math.round((t.pass / t.total) * 100) : 0;
    console.log(`  ${id.padEnd(22)} ${String(t.pass).padStart(2)}/${t.total}  (${cp}%)`);
  }

  console.log(`\n══ SCORECARD ══`);
  console.log(`  Passages passing rubric: ${passed}/${items.length}  (${pct}%)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
