import { describe, it, expect } from "vitest";
import seed from "@/data/seed-passages.json";
import { SKILL_IDS, validatePassageShape } from "@/lib/schema";
import type { RawPassage } from "@/lib/types";

const library = seed as unknown as RawPassage[];

describe("content library contract (offline)", () => {
  it("ships a non-empty library", () => {
    expect(library.length).toBeGreaterThan(0);
  });

  it("every library passage satisfies the strict quality contract", () => {
    const failures: string[] = [];
    for (const p of library) {
      const r = validatePassageShape(p, { strict: true });
      if (!r.ok) failures.push(`"${p.title}": ${r.errors.join("; ")}`);
    }
    expect(failures).toEqual([]);
  });

  it("enforces exactly 5 questions × 4 options, valid skills, in-range correctIndex", () => {
    for (const p of library) {
      expect(p.questions.length, p.title).toBe(5);
      for (const q of p.questions) {
        expect(q.options.length).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(SKILL_IDS as readonly string[]).toContain(q.skill);
      }
    }
  });

  it("rejects a malformed passage in strict mode", () => {
    const bad = validatePassageShape({ passage: "tiny", questions: [], vocabulary: [] }, { strict: true });
    expect(bad.ok).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  it("accepts a minimal valid passage in lenient (runtime) mode", () => {
    const ok = validatePassageShape(
      {
        passage: "y".repeat(60),
        questions: [{ skill: "main_idea", question: "q", options: ["a", "b"], correctIndex: 1, explanation: "e" }],
        vocabulary: [],
      },
      { strict: false },
    );
    expect(ok.ok).toBe(true);
  });
});
