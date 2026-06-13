# ReadU — Build Brief

## The problem
Reading comprehension is the gateway skill for everything else in school, yet most
middle schoolers practice it on generic, one-size-fits-all passages that are either
too hard, too easy, or simply boring. Disengaged readers don't improve. The two
levers that actually move engagement — **the right difficulty** and **a topic the
student cares about** — are exactly what static worksheets can't personalize.

## Who it's for
- **Primary:** middle-school students (ages 10–14), across a wide ability range (reading levels grade 3–9).
- **Secondary:** teachers and parents who want practice that adapts without manual leveling.

## What "done" looks like
A student opens ReadU, picks topics they love, and from then on every reading is:
1. **Personalized** — a passage about *their* interest, at *their* current level.
2. **Adaptive** — difficulty and question focus shift toward the skills they're weakest at, session over session (8 tracked comprehension skills; reading level nudges up/down on performance).
3. **Quality-assured** — the content is good enough to learn from, every time.
4. **Always available** — works live with an API key, and fully offline via a pre-generated library (the no-key demo path is a first-class citizen).

## The orchestration story: the model checks its own work
ReadU's differentiator is that **Opus 4.8 doesn't just generate — it grades itself
against an explicit rubric and regenerates when it falls short.**

- **Explicit bar:** [`rubric.json`](rubric.json) (human-readable: [`RUBRIC.md`](RUBRIC.md)) — 9 machine-checkable criteria (reading level, length, exactly-5×4 format, single defensible answer, plausible distractors, skill match, vocabulary grounded in the passage, age-appropriate, factual).
- **Self-grading loop:** [`lib/generate.ts`](lib/generate.ts) `generateVerifiedPassage()` → generate a draft → grade it with a second Opus 4.8 call ([`lib/verify.ts`](lib/verify.ts), structured output) → if it fails, regenerate **once** feeding the critique back as fix-instructions → return the best attempt with its `verification` attached. The reader shows a **"✓ Verified by Opus"** badge.
- **Reproducible quality audit:** [`scripts/grade-library.ts`](scripts/grade-library.ts) (`npm run grade`) runs the entire content library through the verifier against `rubric.json` and prints a scorecard with an overall pass rate — so anyone can re-run the quality check tomorrow.
- **Offline contracts:** [`npm test`](package.json) (vitest) unit-tests the pure adaptive engine and asserts every passage matches the structural contract — no API key required.

## Verify it yourself
```bash
npm test          # offline: adaptive engine + passage structural contract
npm run grade     # Opus 4.8 grades the whole library vs rubric.json → scorecard
npm run build     # production build
npm run dev       # http://localhost:3000
```

**Live:** https://readu-five.vercel.app · **Source:** https://github.com/willfeldman/readu

## Tech
Next.js 14 (App Router) · TypeScript · Tailwind · Anthropic SDK (`claude-opus-4-8`,
structured outputs) · Framer Motion. Profiles persist in `localStorage`; no backend DB.
