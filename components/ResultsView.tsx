"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, TrendingUp, X, Zap } from "lucide-react";
import type { AnswerRecord, Passage, SessionMode } from "@/lib/types";
import type { SessionOutcome } from "@/lib/adaptive";
import { SKILL_MAP, BADGE_MAP } from "@/lib/skills";
import { SkillIcon } from "./SkillIcon";
import { ProgressRing } from "./ProgressRing";
import { Confetti } from "./Confetti";

function headline(accuracy: number, leveledUp: boolean): string {
  if (accuracy === 1) return "Perfect score! 🌟";
  if (leveledUp) return "You leveled up! 🎉";
  if (accuracy >= 0.8) return "Awesome reading!";
  if (accuracy >= 0.6) return "Nice work!";
  return "Good effort!";
}

function levelMessage(o: SessionOutcome, mode: SessionMode): string {
  if (mode === "baseline") return `We set your starting reading level to ${o.levelAfter.toFixed(1)}.`;
  if (o.leveledUp) return `You leveled up to ${o.levelAfter.toFixed(1)} — the next passages will be a little richer.`;
  if (o.levelDelta > 0) return `Reading level nudged up to ${o.levelAfter.toFixed(1)}.`;
  if (o.levelDelta < 0) return `We eased your level to ${o.levelAfter.toFixed(1)} so the next read fits just right.`;
  return `Reading level holding steady at ${o.levelAfter.toFixed(1)}.`;
}

export function ResultsView({
  outcome,
  passage,
  answers,
  mode,
  onContinue,
  onAnother,
}: {
  outcome: SessionOutcome;
  passage: Passage;
  answers: AnswerRecord[];
  mode: SessionMode;
  onContinue: () => void;
  onAnother?: () => void;
}) {
  const pct = Math.round(outcome.accuracy * 100);
  const ringColor = outcome.accuracy >= 0.8 ? "#12B488" : outcome.accuracy >= 0.6 ? "#FFB23E" : "#FF6B5E";
  const celebrate = outcome.accuracy >= 0.8 || outcome.leveledUp || outcome.newBadges.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-5"
    >
      {celebrate && <Confetti />}

      <div className="card overflow-hidden text-center">
        <div className="bg-gradient-to-br from-primary-soft/70 to-accent-soft/40 px-6 pb-6 pt-8 sm:px-10">
          <p className="mb-5 font-display text-3xl font-extrabold sm:text-4xl">
            {headline(outcome.accuracy, outcome.leveledUp)}
          </p>
          <ProgressRing value={outcome.accuracy} size={150} stroke={14} color={ringColor}>
            <span className="font-display text-4xl font-extrabold" style={{ color: ringColor }}>
              {pct}%
            </span>
            <span className="text-xs font-semibold text-ink-soft">
              {outcome.correct}/{outcome.total} correct
            </span>
          </ProgressRing>
        </div>

        <div className="grid grid-cols-2 divide-x divide-black/5 border-t border-black/5">
          <div className="flex items-center justify-center gap-2 py-4">
            <Zap size={20} className="text-gold" />
            <span className="font-display text-2xl font-extrabold">+{outcome.xpEarned}</span>
            <span className="text-sm font-semibold text-ink-soft">XP</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-4">
            <TrendingUp size={20} className="text-primary" />
            <span className="font-display text-lg font-extrabold">
              {outcome.levelBefore.toFixed(1)} → {outcome.levelAfter.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <p className="text-center text-sm font-semibold text-ink-soft">{levelMessage(outcome, mode)}</p>
      </div>

      {/* Per-question skill breakdown */}
      <div className="card p-5 sm:p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">How you did, skill by skill</p>
        <div className="flex flex-wrap gap-2">
          {answers.map((a, i) => {
            const s = SKILL_MAP[a.skill];
            return (
              <span
                key={i}
                className="chip"
                style={{
                  backgroundColor: a.correct ? "#D6F4EB" : "#FCDEE5",
                  color: a.correct ? "#0A8A66" : "#C82B4C",
                }}
              >
                <SkillIcon name={s.icon} size={14} strokeWidth={2.5} />
                {s.short}
                {a.correct ? <Check size={14} /> : <X size={14} />}
              </span>
            );
          })}
        </div>
      </div>

      {/* New badges */}
      {outcome.newBadges.length > 0 && (
        <div className="card bg-gradient-to-br from-gold-soft to-accent-soft p-5 sm:p-6">
          <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-gold-dark">
            {outcome.newBadges.length > 1 ? "New badges unlocked!" : "New badge unlocked!"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {outcome.newBadges.map((id, i) => {
              const b = BADGE_MAP[id];
              if (!b) return null;
              return (
                <motion.div
                  key={id}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 260, damping: 14 }}
                  className="flex w-28 flex-col items-center gap-1 text-center"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-lift">
                    {b.emoji}
                  </span>
                  <span className="text-sm font-bold">{b.label}</span>
                  <span className="text-[11px] leading-tight text-ink-soft">{b.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {mode === "practice" && onAnother && (
          <button className="btn-primary text-lg" onClick={onAnother}>
            Read another <RotateCcw size={18} />
          </button>
        )}
        <button className={mode === "baseline" ? "btn-primary text-lg" : "btn-ghost"} onClick={onContinue}>
          {mode === "baseline" ? "See my dashboard" : "Back to dashboard"} <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
