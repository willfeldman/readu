"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, Gauge, Target } from "lucide-react";
import { Logo } from "./Logo";

export function BaselineIntro({ name, onStart }: { name: string; onStart: () => void }) {
  const points = [
    { icon: Compass, title: "One short reading", text: "Read a passage on a topic you picked." },
    { icon: Target, title: "Five quick questions", text: "No grades, no pressure — just answer your best." },
    { icon: Gauge, title: "Your starting level", text: "We'll tune every future reading to fit you." },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden text-center">
        <div className="bg-gradient-to-br from-primary-soft/70 to-accent-soft/40 px-6 py-9 sm:px-10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Compass size={30} />
          </div>
          <h1 className="text-3xl font-extrabold">Let&apos;s find your level, {name.trim() || "reader"}!</h1>
          <p className="mx-auto mt-2 max-w-sm text-ink-soft">
            A quick baseline reading helps ReadU pick passages that are challenging — but never too hard.
          </p>
        </div>

        <div className="space-y-3 p-6 text-left sm:p-8">
          {points.map((p) => (
            <div key={p.title} className="flex items-start gap-3 rounded-2xl bg-paper p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <p.icon size={20} />
              </span>
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-ink-soft">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-7 flex justify-center">
        <button className="btn-primary text-lg" onClick={onStart}>
          Start my baseline reading <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
