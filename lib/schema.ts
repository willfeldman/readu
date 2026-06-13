// Shared JSON schema for generated passages + a pure, offline shape validator.
// Kept free of the Anthropic SDK so it can be imported by tests and scripts.

import type { Question, VocabWord } from "./types";

export const SKILL_IDS = [
  "main_idea",
  "detail",
  "inference",
  "vocabulary",
  "cause_effect",
  "sequence",
  "authors_purpose",
  "figurative",
] as const;

/** Structured-output schema Opus 4.8 fills when generating a passage + questions. */
export const PASSAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Catchy, kid-friendly title (3-8 words)." },
    summary: { type: "string", description: "One-sentence, spoiler-free teaser shown before reading." },
    passage: { type: "string", description: "The full reading passage text, in the requested word range." },
    questions: {
      type: "array",
      description: "Exactly 5 multiple-choice comprehension questions.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          skill: { type: "string", enum: [...SKILL_IDS] },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, description: "Exactly 4 answer choices." },
          correctIndex: { type: "integer", description: "0-based index (0-3) of the correct option." },
          explanation: { type: "string", description: "Kid-friendly one-sentence reason the answer is correct." },
        },
        required: ["skill", "question", "options", "correctIndex", "explanation"],
      },
    },
    vocabulary: {
      type: "array",
      description: "Exactly 4 vocabulary words drawn from the passage.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          definition: { type: "string", description: "Short, kid-friendly definition." },
        },
        required: ["word", "definition"],
      },
    },
  },
  required: ["title", "summary", "passage", "questions", "vocabulary"],
};

/** Same as PASSAGE_SCHEMA but without `passage` — used when the passage text is supplied. */
export const QUESTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: PASSAGE_SCHEMA.properties.title,
    summary: PASSAGE_SCHEMA.properties.summary,
    questions: PASSAGE_SCHEMA.properties.questions,
    vocabulary: PASSAGE_SCHEMA.properties.vocabulary,
  },
  required: ["title", "summary", "questions", "vocabulary"],
};

/** Tolerant "does this word appear in the passage" check (handles plurals/tenses). */
export function appearsIn(word: string, passage: string): boolean {
  const hay = passage.toLowerCase();
  const w = word.toLowerCase().trim();
  if (!w) return true;
  if (hay.includes(w)) return true;
  const stem = w.replace(/(ies|es|ed|ing|ly|s)$/i, "");
  if (stem.length >= 4 && hay.includes(stem)) return true;
  // morphological tolerance: a long shared prefix (e.g. "perseverance" vs "persevered").
  if (w.length >= 6 && hay.includes(w.slice(0, 6))) return true;
  return false;
}

export interface ShapeCheck {
  ok: boolean;
  errors: string[];
}

interface PassageLike {
  passage?: unknown;
  questions?: unknown;
  vocabulary?: unknown;
}

/**
 * Validate the structural invariants of a passage object.
 * - lenient (default): what runtime generation must satisfy (>=1 question, >=2 options).
 * - strict: the published quality bar (exactly 5 questions, exactly 4 options, vocab grounded).
 */
export function validatePassageShape(p: PassageLike, opts: { strict?: boolean } = {}): ShapeCheck {
  const strict = opts.strict ?? false;
  const errors: string[] = [];

  const passage = typeof p.passage === "string" ? p.passage : "";
  if (passage.trim().length < 40) errors.push("passage is missing or too short");

  const questions = (Array.isArray(p.questions) ? p.questions : []) as Question[];
  if (strict ? questions.length !== 5 : questions.length < 1) {
    errors.push(`expected ${strict ? "exactly 5" : "at least 1"} questions, got ${questions.length}`);
  }

  questions.forEach((q, i) => {
    const options = Array.isArray(q?.options) ? q.options : [];
    if (strict ? options.length !== 4 : options.length < 2) {
      errors.push(`q${i + 1}: expected ${strict ? "4" : "≥2"} options, got ${options.length}`);
    }
    if (typeof q?.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= options.length) {
      errors.push(`q${i + 1}: correctIndex out of range`);
    }
    if (!(SKILL_IDS as readonly string[]).includes(q?.skill as string)) {
      errors.push(`q${i + 1}: invalid skill "${q?.skill}"`);
    }
  });

  // Vocabulary grounding is a quality bar (enforced in strict/contract checks), not a
  // runtime hard-fail — the Opus verifier judges vocab semantically during generation.
  const vocab = (Array.isArray(p.vocabulary) ? p.vocabulary : []) as VocabWord[];
  if (strict) {
    if (vocab.length === 0) errors.push("no vocabulary words");
    vocab.forEach((v) => {
      if (v?.word && !appearsIn(v.word, passage)) {
        errors.push(`vocabulary "${v.word}" does not appear in the passage`);
      }
    });
  }

  return { ok: errors.length === 0, errors };
}
