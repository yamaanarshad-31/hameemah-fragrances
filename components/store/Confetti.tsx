"use client";
import { motion } from "motion/react";

const COLORS = ["#d4af37", "#f3dc8f", "#0f3d2a", "#155238", "#fff3c4"];

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 70 }, (_, i) => {
        const x = (i * 37) % 100;
        return (
          <motion.span
            key={i}
            className="absolute top-[-5%] block"
            style={{ left: `${x}%`, width: 6 + (i % 4) * 2, height: 10 + (i % 3) * 4, background: COLORS[i % COLORS.length], borderRadius: i % 3 ? 2 : 99 }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ y: "110vh", rotate: 360 * ((i % 5) + 1), x: ((i % 7) - 3) * 30, opacity: [1, 1, 0] }}
            transition={{ duration: 2.6 + (i % 5) * 0.4, delay: (i % 10) * 0.08, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}
