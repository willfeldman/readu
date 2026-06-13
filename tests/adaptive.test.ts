import { describe, it, expect } from "vitest";
import {
  applySession,
  bandForLevel,
  clamp,
  estimateBaselineLevel,
  newProfile,
  nextFocusSkills,
  round1,
  todayStr,
} from "@/lib/adaptive";
import type { AnswerRecord, Passage, Profile, SkillId } from "@/lib/types";

function stubPassage(grade = 6): Passage {
  return {
    id: "test",
    title: "Test Passage",
    summary: "",
    passage: "x".repeat(60),
    interestId: "space",
    interestLabel: "Space & Astronomy",
    band: bandForLevel(grade),
    grade,
    questions: [],
    vocabulary: [],
    source: "ai",
  };
}

/** Build an answer set: `correct` of `total` answers correct, all on one skill. */
function answers(skill: SkillId, correct: number, total: number): AnswerRecord[] {
  return Array.from({ length: total }, (_, i) => ({ skill, correct: i < correct }));
}

describe("clamp / round1", () => {
  it("clamps to range", () => {
    expect(clamp(12, 3, 9)).toBe(9);
    expect(clamp(1, 3, 9)).toBe(3);
    expect(clamp(5, 3, 9)).toBe(5);
  });
  it("rounds to one decimal place", () => {
    expect(round1(6.24)).toBe(6.2);
    expect(round1(6.25)).toBe(6.3);
  });
});

describe("bandForLevel", () => {
  it("maps levels to grade bands", () => {
    expect(bandForLevel(4)).toBe("emerging");
    expect(bandForLevel(5)).toBe("growing");
    expect(bandForLevel(6)).toBe("growing");
    expect(bandForLevel(8)).toBe("advanced");
  });
});

describe("estimateBaselineLevel", () => {
  it("treats ~70% as a well-matched level", () => {
    expect(estimateBaselineLevel(0.7, 6)).toBe(6);
  });
  it("scales up for high accuracy and down for low", () => {
    expect(estimateBaselineLevel(1, 6)).toBe(7);
    expect(estimateBaselineLevel(0, 6)).toBe(3);
  });
  it("clamps to the 3..9 range", () => {
    expect(estimateBaselineLevel(1, 8)).toBe(9);
    expect(estimateBaselineLevel(0, 4)).toBe(3);
  });
});

describe("applySession — level adaptation (practice)", () => {
  const base = newProfile("T", 6, ["space"]); // level 6

  it("bumps level up by 0.5 at >= 85% accuracy", () => {
    const o = applySession(base, stubPassage(6), answers("inference", 17, 20), "practice");
    expect(o.accuracy).toBeCloseTo(0.85);
    expect(o.levelAfter).toBe(6.5);
  });
  it("drops level by 0.5 at <= 50% accuracy", () => {
    const o = applySession(base, stubPassage(6), answers("inference", 1, 2), "practice");
    expect(o.levelAfter).toBe(5.5);
  });
  it("nudges up by 0.2 in the 70-85% band", () => {
    const o = applySession(base, stubPassage(6), answers("inference", 4, 5), "practice");
    expect(o.levelAfter).toBe(6.2);
  });
  it("eases down by 0.1 in the 50-70% band", () => {
    const o = applySession(base, stubPassage(6), answers("inference", 3, 5), "practice");
    expect(o.levelAfter).toBe(5.9);
  });
});

describe("applySession — baseline mode", () => {
  it("sets the level from the baseline estimate and marks baseline done", () => {
    const o = applySession(newProfile("T", 6, ["space"]), stubPassage(6), answers("inference", 5, 5), "baseline");
    expect(o.levelAfter).toBe(7);
    expect(o.profile.baselineDone).toBe(true);
  });
});

describe("applySession — XP", () => {
  it("awards per-correct XP + completion + perfect bonus", () => {
    // grade 6 → 16 XP/correct; 5 correct = 80, +5 completion, +25 perfect = 110
    const o = applySession(newProfile("T", 6, ["space"]), stubPassage(6), answers("inference", 5, 5), "practice");
    expect(o.xpEarned).toBe(110);
    expect(o.profile.xp).toBe(110);
  });
});

describe("applySession — skill mastery (EWMA)", () => {
  it("seeds the first attempt cleanly, then blends", () => {
    let r = applySession(newProfile("T", 6, ["space"]), stubPassage(6), [{ skill: "inference", correct: true }], "practice");
    expect(r.profile.skills.inference.mastery).toBe(1);
    expect(r.profile.skills.inference.attempts).toBe(1);

    r = applySession(r.profile, stubPassage(6), [{ skill: "inference", correct: false }], "practice");
    expect(r.profile.skills.inference.mastery).toBe(0.6); // 1*0.6 + 0*0.4
    expect(r.profile.skills.inference.attempts).toBe(2);
  });
});

describe("applySession — streak", () => {
  it("starts a streak at 1", () => {
    const s = applySession(newProfile("T", 6, ["space"]), stubPassage(6), answers("inference", 3, 5), "practice");
    expect(s.profile.streak).toBe(1);
    expect(s.profile.passagesRead).toBe(1);
  });
  it("increments when the last active day was yesterday", () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const prof: Profile = { ...newProfile("T", 6, ["space"]), lastActiveDay: todayStr(y), streak: 2 };
    const s = applySession(prof, stubPassage(6), answers("inference", 3, 5), "practice");
    expect(s.profile.streak).toBe(3);
  });
  it("resets to 1 after a gap", () => {
    const old = new Date();
    old.setDate(old.getDate() - 5);
    const prof: Profile = { ...newProfile("T", 6, ["space"]), lastActiveDay: todayStr(old), streak: 9 };
    const s = applySession(prof, stubPassage(6), answers("inference", 3, 5), "practice");
    expect(s.profile.streak).toBe(1);
  });
});

describe("applySession — badges", () => {
  it("awards first_steps + perfect_run on a perfect baseline", () => {
    const o = applySession(newProfile("T", 6, ["space"]), stubPassage(6), answers("inference", 5, 5), "baseline");
    expect(o.newBadges).toContain("first_steps");
    expect(o.newBadges).toContain("perfect_run");
  });
  it("does not award first_steps on a practice run before baseline", () => {
    const o = applySession(newProfile("T", 6, ["space"]), stubPassage(6), answers("inference", 5, 5), "practice");
    expect(o.newBadges).toContain("perfect_run");
    expect(o.newBadges).not.toContain("first_steps");
  });
});

describe("nextFocusSkills", () => {
  it("explores unseen skills for a brand-new profile", () => {
    expect(nextFocusSkills(newProfile("T", 6, ["space"])).length).toBe(2);
  });
  it("surfaces the weakest practiced skill first", () => {
    const p = newProfile("T", 6, ["space"]);
    p.skills.inference = { attempts: 3, correct: 0, mastery: 0.2 };
    expect(nextFocusSkills(p)[0]).toBe("inference");
  });
  it("returns nothing when every skill is strong and explored", () => {
    const p = newProfile("T", 6, ["space"]);
    (Object.keys(p.skills) as SkillId[]).forEach((k) => {
      p.skills[k] = { attempts: 3, correct: 3, mastery: 0.95 };
    });
    expect(nextFocusSkills(p)).toEqual([]);
  });
});
