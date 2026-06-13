// Core data model for ReadU.

export type SkillId =
  | "main_idea"
  | "detail"
  | "inference"
  | "vocabulary"
  | "cause_effect"
  | "sequence"
  | "authors_purpose"
  | "figurative";

export type Band = "emerging" | "growing" | "advanced";

export type PassageSource = "ai" | "library";

export interface Question {
  skill: SkillId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VocabWord {
  word: string;
  definition: string;
}

/** A complete reading unit: one passage + its question set. */
export interface Passage {
  id: string;
  title: string;
  summary: string;
  passage: string;
  interestId: string;
  interestLabel: string;
  band: Band;
  grade: number; // reading level (grade) of THIS passage
  questions: Question[];
  vocabulary: VocabWord[];
  source: PassageSource;
}

/** Raw passage as produced by the model / stored in the seed library. */
export interface RawPassage {
  interestId: string;
  interestLabel: string;
  band: Band;
  grade: number;
  title: string;
  summary: string;
  passage: string;
  questions: Question[];
  vocabulary: VocabWord[];
}

export interface SkillStat {
  attempts: number;
  correct: number;
  mastery: number; // 0..1, exponentially-weighted accuracy
}

export interface AnswerRecord {
  skill: SkillId;
  correct: boolean;
}

export interface SessionRecord {
  id: string;
  date: number;
  passageTitle: string;
  interestId: string;
  interestLabel: string;
  grade: number;
  total: number;
  correct: number;
  xp: number;
  answers: AnswerRecord[];
  levelBefore: number;
  levelAfter: number;
  mode: SessionMode;
  source: PassageSource;
}

export type SessionMode = "baseline" | "practice";

export interface Profile {
  version: number;
  name: string;
  gradeLevel: number; // self-reported school grade
  interests: string[]; // interest ids
  level: number; // current reading level (grade, float, clamped to LEVEL_MIN..LEVEL_MAX)
  baselineDone: boolean;
  xp: number;
  streak: number;
  lastActiveDay: string | null; // yyyy-mm-dd
  skills: Record<SkillId, SkillStat>;
  badges: string[];
  sessions: SessionRecord[];
  passagesRead: number;
  createdAt: number;
}

/** Request body for the passage-generation API. */
export interface PassageRequest {
  interests: string[];
  level: number;
  focusSkills: SkillId[];
  mode: SessionMode;
  excludeTitles?: string[];
  readerName?: string;
}

export interface PassageResponse {
  passage: Passage;
  source: PassageSource;
  note?: string;
}
