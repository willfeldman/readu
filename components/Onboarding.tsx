"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { INTERESTS } from "@/lib/skills";
import { Logo } from "./Logo";

const GRADES = [4, 5, 6, 7, 8, 9];

export function Onboarding({
  onComplete,
}: {
  onComplete: (name: string, grade: number, interests: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(6);
  const [interests, setInterests] = useState<string[]>([]);

  function toggle(id: string) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const canContinue = step === 0 ? name.trim().length > 0 : interests.length >= 2;

  function advance() {
    if (step === 0) setStep(1);
    else onComplete(name, grade, interests);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <div className="flex gap-1.5">
          {[0, 1].map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${s === step ? "w-8 bg-primary" : "w-2 bg-primary-soft"}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            <span className="chip bg-primary-soft text-primary-700">
              <Sparkles size={14} /> Welcome to ReadU
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Reading that{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                reads you
              </span>
              .
            </h1>
            <p className="mt-3 text-lg text-ink-soft">
              Stories and articles written just for you — and they get smarter as you do. First, the basics.
            </p>

            <div className="card mt-8 p-6 sm:p-8">
              <label className="mb-2 block text-sm font-bold">What should we call you?</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canContinue && advance()}
                placeholder="Your first name"
                maxLength={24}
                className="w-full rounded-2xl border-2 border-black/10 bg-paper px-4 py-3.5 text-lg font-semibold outline-none transition focus:border-primary"
              />

              <label className="mb-3 mt-6 block text-sm font-bold">What grade are you in?</label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`h-12 w-12 rounded-2xl text-lg font-bold transition ${
                      grade === g
                        ? "bg-primary text-white shadow-glow"
                        : "bg-paper text-ink-soft hover:bg-primary-soft"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              What are you into, {name.trim() || "reader"}?
            </h1>
            <p className="mt-2 text-ink-soft">
              Pick a few topics you love. We&apos;ll write your reading around them.{" "}
              <span className="font-semibold text-primary-700">Choose at least 2.</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {INTERESTS.map((it) => {
                const on = interests.includes(it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggle(it.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition ${
                      on ? "border-transparent text-white shadow-lift" : "border-black/10 bg-white hover:border-primary/40"
                    }`}
                    style={on ? { backgroundImage: `linear-gradient(135deg, ${it.from}, ${it.to})` } : undefined}
                  >
                    {on && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/25">
                        <Check size={15} />
                      </span>
                    )}
                    <span className="text-3xl">{it.emoji}</span>
                    <p className={`mt-2 font-bold leading-tight ${on ? "text-white" : "text-ink"}`}>{it.label}</p>
                    <p className={`text-xs ${on ? "text-white/85" : "text-ink-faint"}`}>{it.blurb}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-3">
        {step === 1 ? (
          <button className="btn-ghost" onClick={() => setStep(0)}>
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <span className="text-sm font-semibold text-ink-faint">Takes 30 seconds</span>
        )}
        <button className="btn-primary text-lg" disabled={!canContinue} onClick={advance}>
          {step === 0 ? "Continue" : `Let's go (${interests.length})`} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
