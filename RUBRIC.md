# ReadU Passage Quality Rubric

The quality bar every generated passage + question set must clear. ReadU doesn't
just generate content — **Opus 4.8 grades its own output against this rubric and
regenerates when it fails** (see `lib/verify.ts`). The machine-readable source of
truth is [`rubric.json`](rubric.json); this file is the human-readable mirror.

**Audience:** U.S. middle-school students, ages 10–14.

Each criterion is graded **pass / fail** by an independent Opus 4.8 call.

| # | Criterion | Critical? | What it checks |
|---|-----------|:---------:|----------------|
| 1 | **Reading level** | ✅ | Estimated U.S. grade level is within **±1 grade** of the target. |
| 2 | **Length** | — | Word count is within the band's range — G4: 190–260, G6: 300–410, G8: 440–560. |
| 3 | **Question count & format** | ✅ | Exactly **5 questions**, each with exactly **4 options**. |
| 4 | **Single correct answer** | ✅ | Each question has exactly **one** defensible answer, and `correctIndex` points to it. |
| 5 | **Plausible distractors** | — | Wrong options are plausible but clearly incorrect on a careful read. |
| 6 | **Skill match** | — | Each question's `skill` label matches what it tests; requested focus skills appear. |
| 7 | **Vocabulary grounded** | ✅ | Every vocab word appears in the passage; definitions are accurate and kid-friendly. |
| 8 | **Age appropriate** | ✅ | No violence, romance, or frightening content; suitable for ages 10–14. |
| 9 | **Factual accuracy** | ✅ | Informational passages are factually accurate (auto-pass for fiction). |

## Pass rule

> A passage **passes** only if **every critical criterion passes** *and* **at most one
> non-critical criterion fails**.

On failure, ReadU feeds the grader's critique back into a single regeneration attempt
(2 attempts total), then returns the best result with its verification attached.

## Reproduce it

```bash
npm run grade   # grades the whole content library against this rubric, prints a scorecard
npm test        # offline structural contract tests (no API key needed)
```
