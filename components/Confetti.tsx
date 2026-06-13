"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#6C4AE2", "#FF6B5E", "#FFB23E", "#12B488", "#2FA9E0", "#EE4A6B"];

export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
        round: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 1, rotate: p.rotate }}
          animate={{ y: "110vh", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.6),
            backgroundColor: p.color,
            borderRadius: p.round ? "999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
