"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, BookOpen, Clock, Library, Loader2, Minus, Plus, Sparkles } from "lucide-react";
import type { Passage } from "@/lib/types";
import { interestEmoji } from "@/lib/skills";

const SIZES = ["1.02rem", "1.18rem", "1.36rem"];

const Caret = () => (
  <span className="ml-0.5 inline-block h-[1.05em] w-[3px] translate-y-[2px] animate-pulse rounded-sm bg-primary align-middle" />
);

export function PassageReader({
  passage,
  onStartQuestions,
  note,
  streaming = false,
}: {
  passage: Passage;
  onStartQuestions: () => void;
  note?: string;
  streaming?: boolean;
}) {
  const [sz, setSz] = useState(1);
  const paragraphs = passage.passage
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = passage.passage.trim() ? passage.passage.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <div className="card overflow-hidden">
        <div className="border-b border-black/5 bg-gradient-to-br from-primary-soft/70 to-accent-soft/40 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip bg-white/80 text-ink">
              {interestEmoji(passage.interestId)} {passage.interestLabel}
            </span>
            <span className="chip bg-white/80 text-ink">Grade {passage.grade}</span>
            {words > 0 && (
              <span className="chip bg-white/80 text-ink-soft">
                <Clock size={13} /> {minutes} min read
              </span>
            )}
            {passage.source === "ai" ? (
              <span className="chip bg-primary text-white">
                <Sparkles size={13} /> {streaming ? "Writing live · Opus 4.8" : "Written for you · Opus 4.8"}
              </span>
            ) : (
              <span className="chip bg-ink text-white">
                <Library size={13} /> ReadU library
              </span>
            )}
            {passage.verification?.pass && (
              <span
                className="chip bg-mint-soft text-mint-dark"
                title="Opus 4.8 graded this against ReadU's quality rubric"
              >
                <BadgeCheck size={13} /> Verified by Opus
              </span>
            )}
          </div>
          {passage.title ? (
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{passage.title}</h1>
          ) : (
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white/60" />
          )}
          {passage.summary && <p className="mt-2 text-ink-soft">{passage.summary}</p>}
        </div>

        <div className="flex items-center justify-between px-6 pt-4 sm:px-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <BookOpen size={14} /> {streaming ? "Writing…" : "Read closely"}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink-soft transition hover:bg-primary-soft disabled:opacity-40"
              disabled={sz === 0}
              onClick={() => setSz((s) => Math.max(0, s - 1))}
              aria-label="Smaller text"
            >
              <Minus size={16} />
            </button>
            <span className="px-1 text-xs font-bold text-ink-faint">Aa</span>
            <button
              className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink-soft transition hover:bg-primary-soft disabled:opacity-40"
              disabled={sz === SIZES.length - 1}
              onClick={() => setSz((s) => Math.min(SIZES.length - 1, s + 1))}
              aria-label="Larger text"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="reading px-6 py-5 text-ink sm:px-8" style={{ ["--reading-size" as never]: SIZES[sz] }}>
          {paragraphs.map((p, i) => (
            <p key={i}>
              {p}
              {streaming && i === paragraphs.length - 1 && <Caret />}
            </p>
          ))}
          {streaming && paragraphs.length === 0 && (
            <p className="text-ink-faint">
              <Caret />
            </p>
          )}
        </div>

        {passage.vocabulary && passage.vocabulary.length > 0 && (
          <div className="mx-6 mb-6 rounded-2xl bg-paper p-5 sm:mx-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">Word Bank</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {passage.vocabulary.map((v, i) => (
                <div key={i} className="rounded-xl bg-white p-3 shadow-soft">
                  <p className="font-bold text-primary-700">{v.word}</p>
                  <p className="text-sm text-ink-soft">{v.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {note && <p className="mx-auto mt-3 max-w-md text-center text-xs text-ink-faint">{note}</p>}

      <div className="sticky bottom-4 z-10 mt-5 flex justify-center">
        <button className="btn-primary text-lg" onClick={onStartQuestions} disabled={streaming}>
          {streaming ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Writing your passage…
            </>
          ) : (
            <>
              I&apos;m ready — start questions <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
