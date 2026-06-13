import Anthropic from "@anthropic-ai/sdk";
import rubric from "../rubric.json";
import type { CriterionResult, Passage, SkillId, VerificationResult } from "./types";
import { SKILL_MAP } from "./skills";

const MODEL = "claude-opus-4-8";

interface RubricCriterion {
  id: string;
  label: string;
  critical: boolean;
  description: string;
}

const CRITERIA = rubric.criteria as RubricCriterion[];
const CRITERION_IDS = CRITERIA.map((c) => c.id);
const CRITICAL = new Set(CRITERIA.filter((c) => c.critical).map((c) => c.id));

const VERIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    perCriterion: {
      type: "array",
      description: "Exactly one verdict per rubric criterion.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", enum: CRITERION_IDS },
          pass: { type: "boolean" },
          note: { type: "string", description: "Short, specific reason for the verdict." },
        },
        required: ["id", "pass", "note"],
      },
    },
    critique: {
      type: "string",
      description: "If anything failed, specific actionable fixes for a rewrite. Empty string if everything passed.",
    },
  },
  required: ["perCriterion", "critique"],
};

const SYSTEM_PROMPT = `You are ReadU's quality grader for middle-school (ages 10-14) reading content. You are strict but fair: a criterion passes only when it is genuinely met.

Method:
- For "single_correct", actually answer each question yourself from the passage and confirm the marked correctIndex is the single best answer.
- For "plausible_distractors", check that wrong options are tempting but clearly wrong on a careful read.
- For "skill_match", check the declared skill matches what each question really tests.
- For "factual", auto-pass if the passage is clearly fiction; otherwise verify the facts.
- For "vocabulary_grounded", confirm each vocab word appears in the passage and the definition is correct and kid-friendly.
Keep notes short and specific. In "critique", give concrete, actionable rewrite instructions only for what failed; use an empty string if everything passed.`;

/** Overall pass: every critical criterion passes AND at most one non-critical fails (rubric.passRule). */
function overallPass(per: CriterionResult[]): boolean {
  const failed = per.filter((c) => !c.pass);
  const criticalFails = failed.filter((c) => CRITICAL.has(c.id)).length;
  const nonCriticalFails = failed.filter((c) => !CRITICAL.has(c.id)).length;
  return criticalFails === 0 && nonCriticalFails <= 1;
}

export interface VerifyContext {
  targetGrade: number;
  focusSkills?: SkillId[];
  wordRange?: { min: number; max: number };
}

function buildPrompt(p: Passage, ctx: VerifyContext): string {
  const wordCount = p.passage.trim().split(/\s+/).length;
  const focus = (ctx.focusSkills ?? []).map((s) => SKILL_MAP[s]?.label).filter(Boolean) as string[];
  const range = ctx.wordRange ? `${ctx.wordRange.min}-${ctx.wordRange.max} words` : "not specified";
  const criteriaList = CRITERIA.map(
    (c) => `- ${c.id} (${c.critical ? "critical" : "minor"}): ${c.description}`,
  ).join("\n");

  const draft = {
    title: p.title,
    targetGrade: ctx.targetGrade,
    allowedWordRange: range,
    actualWordCount: wordCount,
    focusSkills: focus,
    passage: p.passage,
    questions: p.questions.map((q, i) => ({
      n: i + 1,
      skill: q.skill,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
    vocabulary: p.vocabulary,
  };

  return `Grade this draft reading passage + question set against the ReadU rubric. Return exactly one verdict per criterion.

RUBRIC CRITERIA:
${criteriaList}

DRAFT (JSON):
${JSON.stringify(draft, null, 2)}`;
}

/**
 * Grade a generated passage against rubric.json with a second Opus 4.8 call.
 * Returns a VerificationResult with attempts=1, regenerated=false (the caller adjusts those).
 */
export async function verifyPassage(p: Passage, ctx: VerifyContext): Promise<VerificationResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic();
  const response: any = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 2500,
      output_config: { effort: "low", format: { type: "json_schema", schema: VERIFY_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(p, ctx) }],
    } as any,
    { timeout: 30000, maxRetries: 1 },
  );

  const text: string | undefined = (response.content ?? []).find((b: any) => b.type === "text")?.text;
  if (!text) throw new Error("No verification content returned from model");

  const parsed = JSON.parse(text) as { perCriterion: CriterionResult[]; critique: string };
  const byId = new Map((parsed.perCriterion ?? []).map((c) => [c.id, c]));
  const per: CriterionResult[] = CRITERIA.map(
    (c) => byId.get(c.id) ?? { id: c.id, pass: false, note: "not graded" },
  );

  return {
    pass: overallPass(per),
    perCriterion: per,
    critique: parsed.critique ?? "",
    attempts: 1,
    regenerated: false,
  };
}
