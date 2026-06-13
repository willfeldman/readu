import type { Passage, PassageRequest, SessionMode, SkillId } from "@/lib/types";
import {
  chooseInterest,
  generateQuestionsForPassage,
  streamPassageProse,
  wordRangeForGrade,
} from "@/lib/generate";
import { verifyPassage } from "@/lib/verify";
import { getLibraryPassage, toPassage } from "@/lib/content";
import { bandForLevel, clamp } from "@/lib/adaptive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: Partial<PassageRequest> = {};
  try {
    body = await request.json();
  } catch {
    /* empty body → defaults */
  }

  const req: PassageRequest = {
    interests: Array.isArray(body.interests) ? (body.interests as string[]) : [],
    level: typeof body.level === "number" ? body.level : 6,
    focusSkills: Array.isArray(body.focusSkills) ? (body.focusSkills as SkillId[]) : [],
    mode: (body.mode === "baseline" ? "baseline" : "practice") as SessionMode,
    excludeTitles: Array.isArray(body.excludeTitles) ? (body.excludeTitles as string[]) : [],
    readerName: typeof body.readerName === "string" ? body.readerName : undefined,
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));
      const serveLibrary = (note?: string) => {
        const passage = getLibraryPassage({
          interests: req.interests,
          level: req.level,
          excludeTitles: req.excludeTitles,
        });
        if (passage) send("complete", { passage, note });
        else send("error", { message: "No content available." });
      };

      try {
        // No key → instant library passage (the sacred no-setup demo path).
        if (!process.env.ANTHROPIC_API_KEY) {
          serveLibrary(
            "Reading from the built-in library. Add an ANTHROPIC_API_KEY to have Claude write fresh, personalized passages.",
          );
          controller.close();
          return;
        }

        const interest = chooseInterest(req.interests);
        const grade = clamp(Math.round(req.level), 3, 9);
        const band = bandForLevel(req.level);
        send("meta", { interestId: interest.id, interestLabel: interest.label, grade, band });

        // 1. Stream the passage prose token-by-token.
        let prose: string;
        try {
          prose = await streamPassageProse(req, interest, grade, (t) => send("token", { text: t }));
        } catch (err) {
          console.error("[readu] prose stream failed, serving library:", err);
          serveLibrary("Live generation hit a snag — served a library passage instead.");
          controller.close();
          return;
        }

        // 2. Structured title/summary/questions/vocabulary for the finished passage.
        let qa;
        try {
          qa = await generateQuestionsForPassage(prose, {
            interestLabel: interest.label,
            grade,
            focusSkills: req.focusSkills,
            mode: req.mode,
          });
        } catch (err) {
          // Never dead-end: if question generation fails, fall back to a library passage.
          console.error("[readu] question generation failed, serving library:", err);
          serveLibrary("Live generation hit a snag — served a library passage instead.");
          controller.close();
          return;
        }

        const passage: Passage = toPassage(
          {
            interestId: interest.id,
            interestLabel: interest.label,
            band,
            grade,
            title: qa.title,
            summary: qa.summary,
            passage: prose,
            questions: qa.questions,
            vocabulary: qa.vocabulary ?? [],
          },
          "ai",
        );

        // Reveal the full passage immediately — don't block on verification.
        send("complete", { passage });

        // 3. Self-grade, then stamp the "Verified" badge once it resolves.
        try {
          const v = await verifyPassage(passage, {
            targetGrade: grade,
            focusSkills: req.focusSkills,
            wordRange: wordRangeForGrade(grade),
          });
          send("verified", { verification: { ...v, attempts: 1, regenerated: false } });
        } catch (err) {
          console.error("[readu] verification failed (non-fatal):", err);
        }

        controller.close();
      } catch (err) {
        console.error("[readu] stream route fatal:", err);
        try {
          serveLibrary("Live generation hit a snag — served a library passage instead.");
        } catch {
          /* controller may be closed */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
