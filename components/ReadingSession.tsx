"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, RotateCcw, X } from "lucide-react";
import type { AnswerRecord, Band, Passage, PassageRequest, Profile, SessionMode } from "@/lib/types";
import { applySession, nextFocusSkills, type SessionOutcome } from "@/lib/adaptive";
import { interestLabel } from "@/lib/skills";
import { fetchPassage, streamPassage, type StreamMeta } from "@/lib/api";
import { consumePrefetch, prefetchNext } from "@/lib/prefetch";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { PassageReader } from "./PassageReader";
import { QuestionCard } from "./QuestionCard";
import { ResultsView } from "./ResultsView";

type Phase = "loading" | "reading" | "questions" | "results" | "error";

export function ReadingSession({
  profile,
  mode,
  onComplete,
  onAnother,
  onExit,
}: {
  profile: Profile;
  mode: SessionMode;
  onComplete: (p: Profile) => void;
  onAnother: (p: Profile) => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [streamText, setStreamText] = useState("");
  const [streamMeta, setStreamMeta] = useState<StreamMeta | null>(null);
  const [note, setNote] = useState<string | undefined>();
  const [err, setErr] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const startedRef = useRef(false);

  const load = useCallback(async () => {
    setPhase("loading");
    setErr("");
    setAnswers([]);
    setQIndex(0);
    setAnsweredCurrent(false);
    setOutcome(null);
    setPassage(null);
    setStreamText("");
    setStreamMeta(null);
    setNote(undefined);

    const req: PassageRequest = {
      interests: profile.interests,
      level: profile.level,
      focusSkills: mode === "baseline" ? [] : nextFocusSkills(profile),
      mode,
      excludeTitles: profile.sessions.slice(0, 8).map((s) => s.passageTitle),
      readerName: profile.name,
    };

    // 1. Instant path: a matching passage was prefetched while the reader worked.
    if (mode === "practice") {
      const pre = consumePrefetch(profile);
      if (pre) {
        try {
          const res = await pre;
          setPassage(res.passage);
          setNote(res.note);
          setPhase("reading");
          return;
        } catch {
          /* fall through to streaming */
        }
      }
    }

    // 2. Stream the passage live (token-by-token), with a non-stream fallback.
    let resolved = false;
    try {
      await streamPassage(req, {
        onMeta: (m) => {
          setStreamMeta(m);
          setPhase("reading");
        },
        onToken: (t) => setStreamText((s) => s + t),
        onComplete: (p, n) => {
          resolved = true;
          setPassage(p);
          setNote(n);
          setPhase("reading");
        },
        onVerified: (v) => setPassage((prev) => (prev ? { ...prev, verification: v } : prev)),
        onError: (msg) => {
          resolved = true;
          setErr(msg);
          setPhase("error");
        },
      });
    } catch {
      // streaming transport failed entirely → non-stream fallback (library / no-key)
    }

    if (!resolved) {
      try {
        const res = await fetchPassage(req);
        setPassage(res.passage);
        setNote(res.note);
        setPhase("reading");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      }
    }
  }, [profile, mode]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    load();
  }, [load]);

  function handleAnswered(correct: boolean) {
    if (!passage) return;
    const skill = passage.questions[qIndex].skill;
    setAnswers((a) => [...a, { skill, correct }]);
    setAnsweredCurrent(true);
  }

  function next() {
    if (!passage) return;
    if (qIndex < passage.questions.length - 1) {
      setQIndex((i) => i + 1);
      setAnsweredCurrent(false);
    } else {
      const o = applySession(profile, passage, answers, mode);
      setOutcome(o);
      setPhase("results");
      // Prefetch the next passage now (using the updated profile) so the next start is instant.
      prefetchNext(o.profile);
    }
  }

  // While streaming we render a partial passage built from meta + accumulated text.
  const streamingPassage: Passage | null = streamMeta
    ? {
        id: "streaming",
        title: "",
        summary: "",
        passage: streamText,
        interestId: streamMeta.interestId,
        interestLabel: streamMeta.interestLabel,
        band: streamMeta.band as Band,
        grade: streamMeta.grade,
        questions: [],
        vocabulary: [],
        source: "ai",
      }
    : null;
  const reading = passage ?? streamingPassage;
  const isStreaming = !passage && !!streamMeta;

  const total = passage?.questions.length ?? 0;
  const progress = total > 0 ? ((qIndex + (answeredCurrent ? 1 : 0)) / total) * 100 : 0;
  const showExit = mode === "practice" && phase !== "results";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      {(phase === "reading" || phase === "questions") && (
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            {mode === "baseline" ? (
              <span className="chip bg-gold-soft text-gold-dark">Baseline check</span>
            ) : (
              showExit && (
                <button
                  onClick={onExit}
                  className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-black/5"
                >
                  <X size={16} /> Exit
                </button>
              )
            )}
          </div>
          {phase === "questions" && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-primary-soft">
              <div
                className="h-full rounded-pill bg-gradient-to-r from-primary to-accent"
                style={{ width: `${progress}%`, transition: "width 0.4s ease" }}
              />
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader interestLabel={interestLabel(profile.interests[0] ?? "")} />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md py-16 text-center"
          >
            <div className="card p-8">
              <AlertCircle size={40} className="mx-auto mb-4 text-berry" />
              <h2 className="mb-2 text-xl font-bold">We couldn&apos;t load a passage</h2>
              <p className="mb-6 text-sm text-ink-soft">{err}</p>
              <div className="flex justify-center gap-3">
                <button
                  className="btn-primary"
                  onClick={() => {
                    startedRef.current = true;
                    load();
                  }}
                >
                  <RotateCcw size={18} /> Try again
                </button>
                <button className="btn-ghost" onClick={onExit}>
                  Go back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "reading" && reading && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PassageReader
              passage={reading}
              note={note}
              streaming={isStreaming}
              onStartQuestions={() => {
                if (passage) setPhase("questions");
              }}
            />
          </motion.div>
        )}

        {phase === "questions" && passage && (
          <motion.div
            key={`q-${qIndex}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-2xl"
          >
            <QuestionCard
              question={passage.questions[qIndex]}
              questionNumber={qIndex + 1}
              total={total}
              onAnswered={handleAnswered}
            />
            <AnimatePresence>
              {answeredCurrent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky bottom-4 mt-5 flex justify-center"
                >
                  <button className="btn-primary text-lg" onClick={next}>
                    {qIndex < total - 1 ? "Next question" : "See my results"} <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === "results" && passage && outcome && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultsView
              outcome={outcome}
              passage={passage}
              answers={answers}
              mode={mode}
              onContinue={() => onComplete(outcome.profile)}
              onAnother={mode === "practice" ? () => onAnother(outcome.profile) : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
