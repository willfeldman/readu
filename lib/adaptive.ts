import type {
  AnswerRecord,
  Band,
  Passage,
  Profile,
  SessionMode,
  SessionRecord,
  SkillId,
  SkillStat,
} from "./types";
import { SKILLS } from "./skills";

export const LEVEL_MIN = 3;
export const LEVEL_MAX = 9;
const EWMA_ALPHA = 0.4;
const MASTERY_THRESHOLD = 0.85;
const MASTERY_MIN_ATTEMPTS = 4;

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptySkills(): Record<SkillId, SkillStat> {
  const out = {} as Record<SkillId, SkillStat>;
  for (const s of SKILLS) out[s.id] = { attempts: 0, correct: 0, mastery: 0 };
  return out;
}

export function newProfile(name: string, gradeLevel: number, interests: string[]): Profile {
  return {
    version: 3,
    name: name.trim() || "Reader",
    gradeLevel,
    interests,
    level: clamp(gradeLevel, LEVEL_MIN, LEVEL_MAX),
    baselineDone: false,
    xp: 0,
    streak: 0,
    lastActiveDay: null,
    skills: emptySkills(),
    badges: [],
    sessions: [],
    passagesRead: 0,
    createdAt: Date.now(),
  };
}

export function bandForLevel(level: number): Band {
  if (level < 5) return "emerging";
  if (level < 7) return "growing";
  return "advanced";
}

export function gradeForBand(band: Band): number {
  return band === "emerging" ? 4 : band === "growing" ? 6 : 8;
}

export function bandLabel(band: Band): string {
  return band === "emerging" ? "Emerging Reader" : band === "growing" ? "Growing Reader" : "Advanced Reader";
}

export function levelLabel(level: number): string {
  return `Level ${round1(level).toFixed(1)}`;
}

/** Fractional progress (0..1) toward the next whole level — drives the level meter. */
export function levelProgress(level: number): number {
  return clamp(level - Math.floor(level), 0, 1);
}

export function masteryLabel(m: number): string {
  if (m >= MASTERY_THRESHOLD) return "Mastered";
  if (m >= 0.7) return "Strong";
  if (m >= 0.4) return "Developing";
  return "Building";
}

/** Estimate a starting reading level from a baseline passage result. */
export function estimateBaselineLevel(accuracy: number, passageGrade: number): number {
  // 70% accuracy on a passage means it's well-matched; scale ±2 grades.
  const adjusted = passageGrade + (accuracy - 0.7) * 4;
  return clamp(round1(Math.round(adjusted * 2) / 2), LEVEL_MIN, LEVEL_MAX);
}

/** Skills the reader should practice next, lowest-mastery first. Drives generation. */
export function nextFocusSkills(profile: Profile): SkillId[] {
  const withSignal = SKILLS.map((s) => ({ id: s.id, ...profile.skills[s.id] })).filter(
    (s) => s.attempts >= 2,
  );
  withSignal.sort((a, b) => a.mastery - b.mastery);
  const weak = withSignal.filter((s) => s.mastery < 0.78).slice(0, 3).map((s) => s.id);
  if (weak.length > 0) return weak;
  const unexplored = SKILLS.filter((s) => profile.skills[s.id].attempts === 0).map((s) => s.id);
  return unexplored.slice(0, 2);
}

function xpForCorrect(grade: number): number {
  return 10 + Math.max(0, Math.round((grade - 3) * 2));
}

function streakAfter(profile: Profile, today: string): number {
  if (profile.lastActiveDay === today) return Math.max(1, profile.streak);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = todayStr(y);
  if (profile.lastActiveDay === yesterday) return profile.streak + 1;
  return 1;
}

function distinctInterestCount(profile: Profile): number {
  return new Set(profile.sessions.map((s) => s.interestId)).size;
}

/** Returns the full set of badge ids the profile currently qualifies for. */
function qualifyingBadges(profile: Profile): string[] {
  const earned: string[] = [];
  if (profile.baselineDone) earned.push("first_steps");
  if (profile.passagesRead >= 5) earned.push("bookworm");
  if (profile.passagesRead >= 15) earned.push("bibliophile");
  if (profile.sessions.some((s) => s.total > 0 && s.correct === s.total)) earned.push("perfect_run");
  if (profile.sessions.some((s) => s.levelAfter > s.levelBefore)) earned.push("level_up");
  if (SKILLS.some((s) => profile.skills[s.id].mastery >= MASTERY_THRESHOLD && profile.skills[s.id].attempts >= MASTERY_MIN_ATTEMPTS))
    earned.push("skill_master");
  if (profile.streak >= 3) earned.push("streak_3");
  if (profile.streak >= 7) earned.push("streak_7");
  if (distinctInterestCount(profile) >= 4) earned.push("explorer");
  if (profile.level >= 8) earned.push("scholar");
  return earned;
}

export interface SessionOutcome {
  profile: Profile;
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  levelDelta: number;
  leveledUp: boolean;
  newBadges: string[];
  accuracy: number;
  correct: number;
  total: number;
}

/** Apply a completed session to the profile and return the deltas to celebrate. */
export function applySession(
  prev: Profile,
  passage: Passage,
  answers: AnswerRecord[],
  mode: SessionMode,
): SessionOutcome {
  const profile: Profile = {
    ...prev,
    skills: { ...prev.skills },
    badges: [...prev.badges],
    sessions: [...prev.sessions],
  };

  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const accuracy = total > 0 ? correct / total : 0;

  // Update per-skill mastery (EWMA, clean first-attempt seeding).
  for (const ans of answers) {
    const prevStat = profile.skills[ans.skill];
    const hit = ans.correct ? 1 : 0;
    const mastery =
      prevStat.attempts === 0 ? hit : prevStat.mastery * (1 - EWMA_ALPHA) + hit * EWMA_ALPHA;
    profile.skills[ans.skill] = {
      attempts: prevStat.attempts + 1,
      correct: prevStat.correct + hit,
      mastery: round1(mastery * 100) / 100,
    };
  }

  const levelBefore = prev.level;
  let levelAfter = levelBefore;
  if (mode === "baseline") {
    levelAfter = estimateBaselineLevel(accuracy, passage.grade);
    profile.baselineDone = true;
  } else if (accuracy >= 0.85) {
    levelAfter = clamp(levelBefore + 0.5, LEVEL_MIN, LEVEL_MAX);
  } else if (accuracy <= 0.5) {
    levelAfter = clamp(levelBefore - 0.5, LEVEL_MIN, LEVEL_MAX);
  } else if (accuracy >= 0.7) {
    levelAfter = clamp(levelBefore + 0.2, LEVEL_MIN, LEVEL_MAX);
  } else {
    levelAfter = clamp(levelBefore - 0.1, LEVEL_MIN, LEVEL_MAX);
  }
  levelAfter = round1(levelAfter);
  profile.level = levelAfter;

  // XP
  const perCorrect = xpForCorrect(passage.grade);
  let xpEarned = correct * perCorrect + 5; // +5 completion bonus
  if (total > 0 && correct === total) xpEarned += 25; // perfect bonus
  profile.xp = prev.xp + xpEarned;

  // Streak + activity
  const today = todayStr();
  profile.streak = streakAfter(prev, today);
  profile.lastActiveDay = today;
  profile.passagesRead = prev.passagesRead + 1;

  const record: SessionRecord = {
    id: `s_${Date.now().toString(36)}`,
    date: Date.now(),
    passageTitle: passage.title,
    interestId: passage.interestId,
    interestLabel: passage.interestLabel,
    grade: passage.grade,
    total,
    correct,
    xp: xpEarned,
    answers,
    levelBefore,
    levelAfter,
    mode,
    source: passage.source,
  };
  profile.sessions = [record, ...prev.sessions].slice(0, 60);

  const earned = qualifyingBadges(profile);
  const newBadges = earned.filter((b) => !profile.badges.includes(b));
  profile.badges = [...profile.badges, ...newBadges];

  return {
    profile,
    xpEarned,
    levelBefore,
    levelAfter,
    levelDelta: round1(levelAfter - levelBefore),
    leveledUp: Math.floor(levelAfter) > Math.floor(levelBefore),
    newBadges,
    accuracy,
    correct,
    total,
  };
}

/** Friendly XP → rank for the header chip. */
export function rankForXp(xp: number): { name: string; emoji: string } {
  if (xp >= 2000) return { name: "Legendary Reader", emoji: "👑" };
  if (xp >= 1000) return { name: "Master Reader", emoji: "🏆" };
  if (xp >= 500) return { name: "Expert Reader", emoji: "⭐" };
  if (xp >= 200) return { name: "Skilled Reader", emoji: "🌟" };
  if (xp >= 50) return { name: "Rising Reader", emoji: "✨" };
  return { name: "New Reader", emoji: "🌱" };
}
