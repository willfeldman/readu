import Anthropic from "@anthropic-ai/sdk";
import type { Passage, PassageRequest, RawPassage } from "./types";
import { bandForLevel, clamp } from "./adaptive";
import { INTEREST_MAP, INTERESTS, SKILL_MAP } from "./skills";
import { toPassage } from "./content";

const MODEL = "claude-opus-4-8";

export class NoApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "NoApiKeyError";
  }
}

const PASSAGE_SCHEMA = {
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
          skill: {
            type: "string",
            enum: [
              "main_idea",
              "detail",
              "inference",
              "vocabulary",
              "cause_effect",
              "sequence",
              "authors_purpose",
              "figurative",
            ],
          },
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

function buildUserPrompt(req: PassageRequest, interestLabel: string, grade: number): string {
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

  return `Write ONE reading passage and its comprehension question set.

THEME: ${interestLabel}
TARGET READING LEVEL: U.S. Grade ${grade}.
LENGTH: ${wordsForGrade(grade)}.
GENRE: Choose whichever fits the theme best and is most engaging for this age — an informational article OR a short narrative story.

${focusLine}${excludeLine}

Write exactly 5 questions (each with exactly 4 options), a one-sentence spoiler-free "summary" teaser, and exactly 4 vocabulary words pulled from the passage. Return only the structured object.`;
}

function validate(p: any): asserts p is Omit<RawPassage, "interestId" | "interestLabel" | "band" | "grade"> {
  if (!p || typeof p.passage !== "string" || p.passage.length < 40) {
    throw new Error("Malformed passage from model");
  }
  if (!Array.isArray(p.questions) || p.questions.length === 0) {
    throw new Error("No questions returned");
  }
  for (const q of p.questions) {
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error("Bad options");
    if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      throw new Error("Bad correctIndex");
    }
  }
}

/**
 * Generate a fresh, personalized passage with Claude (Opus 4.8) using structured outputs.
 * Throws NoApiKeyError if no key is configured, or a generic Error on failure — the
 * caller is expected to fall back to the built-in library.
 */
export async function generatePassage(req: PassageRequest): Promise<Passage> {
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
    messages: [{ role: "user", content: buildUserPrompt(req, interest.label, grade) }],
  } as any);

  const text: string | undefined = (response.content ?? []).find((b: any) => b.type === "text")?.text;
  if (!text) throw new Error("No text content returned from model");

  const parsed = JSON.parse(text);
  validate(parsed);

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
