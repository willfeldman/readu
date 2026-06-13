"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { Question } from "@/lib/types";
import { SKILL_MAP } from "@/lib/skills";
import { SkillIcon } from "./SkillIcon";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionCard({
  question,
  questionNumber,
  total,
  onAnswered,
}: {
  question: Question;
  questionNumber: number;
  total: number;
  onAnswered: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const skill = SKILL_MAP[question.skill];
  const isCorrect = answered && selected === question.correctIndex;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    onAnswered(i === question.correctIndex);
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="chip" style={{ backgroundColor: `${skill.color}1A`, color: skill.color }}>
          <SkillIcon name={skill.icon} size={15} strokeWidth={2.5} /> {skill.label}
        </span>
        <span className="shrink-0 text-sm font-semibold text-ink-faint">
          Question {questionNumber} of {total}
        </span>
      </div>

      <h3 className="mb-5 text-xl font-bold leading-snug sm:text-2xl">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const correct = i === question.correctIndex;
          const chosen = selected === i;
          let cls = "border-black/10 bg-white hover:border-primary/50 hover:bg-primary-soft/40";
          let badge = "border-black/10 bg-paper text-ink-soft";
          if (answered) {
            if (correct) {
              cls = "border-mint bg-mint-soft";
              badge = "border-mint bg-mint text-white";
            } else if (chosen) {
              cls = "border-berry bg-berry-soft";
              badge = "border-berry bg-berry text-white";
            } else {
              cls = "border-black/5 bg-white/60 opacity-60";
            }
          }
          return (
            <motion.button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${cls} ${
                answered ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${badge}`}
              >
                {answered && correct ? <Check size={16} /> : answered && chosen ? <X size={16} /> : LETTERS[i]}
              </span>
              <span className="font-medium">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`mt-5 rounded-2xl p-4 ${isCorrect ? "bg-mint-soft" : "bg-gold-soft"}`}>
              <p className="mb-1 font-bold" style={{ color: isCorrect ? "#0A8A66" : "#E0890C" }}>
                {isCorrect ? "Nice — that's right! ✓" : "Good try!"}
              </p>
              <p className="text-sm leading-relaxed text-ink">{question.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
