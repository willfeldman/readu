import Anthropic from "@anthropic-ai/sdk";
import type { Passage, PassageRequest, RawPassage, VerificationResult } from "./types";
import { bandForLevel, clamp } from "./adaptive";
import { INTEREST_MAP, INTERESTS, SKILL_MAP } from "./skills";
import { toPassage } from "./content";
import { PASSAGE_SCHEMA, validatePassageShape } from "./schema";
import { verifyPassage, type VerifyContext } from "./verify";

const MODEL = "claude-opus-4-8";

export class NoApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "NoApiKeyError";
  }
}

// PASSAGE_SCHEMA + validatePassageShape now live in ./schema.ts (pure, testable).

function wordsForGrade(grade: number): string {
  if (grade <= 4) return "190-260 words";
  if (grade <= 6) return "300-410 words";
  return "440-560 words";
}

function chooseInterest(interests: string[]): { id: string; label: string } {
  const pool = interests.filter((i) => INTEREST_MAP[i]);
  const id = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : INTERESTS[Math.floor(Math.random() * INTERESTS.length)].id;
  return { id, label: INTEREST_MAP[id].label };
}

const SYSTEM_PROMPT = `You are ReadU's reading-content engine. You write original reading passages and matched multiple-choice comprehension questions for middle-school students (ages 10-14).

Principles:
- Calibrate vocabulary, sentence length, and concept density precisely to the requested U.S. grade level.
- Be engaging, vivid, and specific. If informational, be factually accurate. Always age-appropriate (no violence, romance, or frightening content).
- Write strong assessment items: one unambiguous correct answer, plausible distractors, and a clear, encouraging one-sentence explanation.
- Each "vocabulary" question must target a word that actually appears in the passage.
- "correctIndex" is 0-based and must point to the correct option.`;

function buildUserPrompt(req: PassageRequest, interestLabel: string, grade: number, critique?: string): string {
  const focus = (req.focusSkills ?? [])
    .map((s) => SKILL_MAP[s]?.label)
    .filter(Boolean) as string[];

  const focusLine =
    req.mode === "baseline"
      ? `This is a BASELINE check. Use a balanced spread of comprehension skills so we can gauge the reader across the board.`
      : focus.length
        ? `Weight the questions toward these skills the reader is currently working to improve: ${focus.join(", ")}. Still include at least one main idea, one inference, and one vocabulary question.`
        : `Include a healthy mix of skills, and be sure to include at least one main idea, one inference, and one vocabulary question.`;

  const excludeLine =
    req.excludeTitles && req.excludeTitles.length
      ? `\nAvoid repeating these recently used titles/topics: ${req.excludeTitles.slice(0, 8).join("; ")}.`
      : "";

  const fixLine = critique
    ? `\n\nA previous draft was REJECTED by the quality checker. Produce a NEW version that fixes these issues:\n${critique}\n`
    : "";

  return `Write ONE reading passage and its comprehension question set.

THEME: ${interestLabel}
TARGET READING LEVEL: U.S. Grade ${grade}.
LENGTH: ${wordsForGrade(grade)}.
GENRE: Choose whichever fits the theme best and is most engaging for this age — an informational article OR a short narrative story.

${focusLine}${excludeLine}${fixLine}

Write exactly 5 questions (each with exactly 4 options), a one-sentence spoiler-free "summary" teaser, and exactly 4 vocabulary words pulled from the passage. Return only the structured object.`;
}

/**
 * Generate a fresh, personalized passage with Claude (Opus 4.8) using structured outputs.
 * Throws NoApiKeyError if no key is configured, or a generic Error on failure — the
 * caller is expected to fall back to the built-in library.
 */
export async function generatePassage(
  req: PassageRequest,
  opts: { critique?: string } = {},
): Promise<Passage> {
  if (!process.env.ANTHROPIC_API_KEY) throw new NoApiKeyError();

  const client = new Anthropic();
  const interest = chooseInterest(req.interests);
  const grade = clamp(Math.round(req.level), 3, 9);
  const band = bandForLevel(req.level);

  // Cast the request body to `any` so output_config + structured outputs work across SDK versions.
  const response: any = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: PASSAGE_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(req, interest.label, grade, opts.critique) }],
  } as any, { timeout: 45000, maxRetries: 1 });

  const text: string | undefined = (response.content ?? []).find((b: any) => b.type === "text")?.text;
  if (!text) throw new Error("No text content returned from model");

  const parsed = JSON.parse(text);
  const shape = validatePassageShape(parsed);
  if (!shape.ok) throw new Error(`Malformed passage from model: ${shape.errors.join("; ")}`);

  const raw: RawPassage = {
    interestId: interest.id,
    interestLabel: interest.label,
    band,
    grade,
    title: parsed.title,
    summary: parsed.summary,
    passage: parsed.passage,
    questions: parsed.questions,
    vocabulary: parsed.vocabulary ?? [],
  };

  return toPassage(raw, "ai");
}

export function wordRangeForGrade(grade: number): { min: number; max: number } {
  if (grade <= 4) return { min: 190, max: 260 };
  if (grade <= 6) return { min: 300, max: 410 };
  return { min: 440, max: 560 };
}

/**
 * Generate → self-grade against rubric.json → (regenerate once with the critique) → return the
 * best attempt with its verification attached. Generation errors propagate so the route can fall
 * back to the library; a verification error degrades gracefully to an unverified passage.
 */
export async function generateVerifiedPassage(req: PassageRequest): Promise<Passage> {
  const grade = clamp(Math.round(req.level), 3, 9);
  const ctx: VerifyContext = {
    targetGrade: grade,
    focusSkills: req.focusSkills,
    wordRange: wordRangeForGrade(grade),
  };

  const first = await generatePassage(req);

  let firstVerif: VerificationResult;
  try {
    firstVerif = await verifyPassage(first, ctx);
  } catch (err) {
    console.error("[readu] verification unavailable, returning unverified draft:", err);
    return first;
  }

  if (firstVerif.pass) {
    return { ...first, verification: { ...firstVerif, attempts: 1, regenerated: false } };
  }

  // Failed grade → one regeneration with the critique fed back into the prompt.
  let second: Passage;
  try {
    second = await generatePassage(req, { critique: firstVerif.critique });
  } catch {
    return { ...first, verification: { ...firstVerif, attempts: 2, regenerated: true } };
  }

  let secondVerif: VerificationResult;
  try {
    secondVerif = await verifyPassage(second, ctx);
  } catch {
    return { ...second, verification: { ...firstVerif, pass: false, attempts: 2, regenerated: true } };
  }

  const firstScore = firstVerif.perCriterion.filter((c) => c.pass).length;
  const secondScore = secondVerif.perCriterion.filter((c) => c.pass).length;
  if (secondVerif.pass || secondScore >= firstScore) {
    return { ...second, verification: { ...secondVerif, attempts: 2, regenerated: true } };
  }
  return { ...first, verification: { ...firstVerif, attempts: 2, regenerated: true } };
}
