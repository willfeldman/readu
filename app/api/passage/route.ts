import { NextResponse } from "next/server";
import type { PassageRequest, PassageResponse, SessionMode, SkillId } from "@/lib/types";
import { generatePassage, NoApiKeyError } from "@/lib/generate";
import { getLibraryPassage } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: Partial<PassageRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const req: PassageRequest = {
    interests: Array.isArray(body.interests) ? (body.interests as string[]) : [],
    level: typeof body.level === "number" ? body.level : 6,
    focusSkills: Array.isArray(body.focusSkills) ? (body.focusSkills as SkillId[]) : [],
    mode: (body.mode === "baseline" ? "baseline" : "practice") as SessionMode,
    excludeTitles: Array.isArray(body.excludeTitles) ? (body.excludeTitles as string[]) : [],
    readerName: typeof body.readerName === "string" ? body.readerName : undefined,
  };

  try {
    const passage = await generatePassage(req);
    const res: PassageResponse = { passage, source: "ai" };
    return NextResponse.json(res);
  } catch (err) {
    const noKey = err instanceof NoApiKeyError;
    if (!noKey) {
      console.error("[readu] live generation failed, falling back to library:", err);
    }
    const passage = getLibraryPassage({
      interests: req.interests,
      level: req.level,
      excludeTitles: req.excludeTitles,
    });
    if (!passage) {
      return NextResponse.json(
        { error: "No content available. Add an ANTHROPIC_API_KEY or restore the content library." },
        { status: 500 },
      );
    }
    const res: PassageResponse = {
      passage,
      source: "library",
      note: noKey
        ? "Reading from the built-in library. Add an ANTHROPIC_API_KEY to have Claude write fresh, personalized passages."
        : "Live generation hit a snag — served a library passage instead.",
    };
    return NextResponse.json(res);
  }
}
