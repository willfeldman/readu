"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

export function Loader({ interestLabel }: { interestLabel?: string }) {
  const theme = interestLabel ? interestLabel.replace(/ &.*$/, "") : "your interests";
  const messages = [
    `Dreaming up a story about ${theme}…`,
    "Choosing just-right words for you…",
    "Writing comprehension questions…",
    "Tuning the difficulty to your level…",
    "Adding a sprinkle of vocabulary…",
    "Almost ready — polishing the details…",
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % messages.length), 2200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-7 py-20 text-center">
      <div className="relative">
        <motion.div
          className="grid h-24 w-24 place-items-center rounded-[1.6rem] bg-gradient-to-br from-primary to-accent text-white shadow-glow"
          animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen size={44} strokeWidth={2.2} />
        </motion.div>
        {[0, 1, 2].map((n) => (
          <motion.span
            key={n}
            className="absolute text-gold"
            style={{ top: n === 0 ? -8 : n === 1 ? 10 : 60, left: n === 0 ? 78 : n === 1 ? -16 : 84 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: n * 0.6, ease: "easeInOut" }}
          >
            <Sparkles size={n === 2 ? 16 : 22} />
          </motion.span>
        ))}
      </div>

      <div className="h-12">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xs text-lg font-semibold text-ink-soft"
        >
          {messages[i]}
        </motion.p>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2].map((n) => (
          <motion.span
            key={n}
            className="h-2.5 w-2.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: n * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}
