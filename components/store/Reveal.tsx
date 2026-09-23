"use client";
import { motion, type HTMLMotionProps } from "motion/react";

export function Reveal({ delay = 0, y = 40, children, className, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Splits a heading into words that rise into place one after another. */
export function SplitHeading({ text, className, as = "h2", delay = 0 }: { text: string; className?: string; as?: "h1" | "h2" | "h3"; delay?: number }) {
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "110%", rotate: 4 }, show: { y: 0, rotate: 0 } }}
            transition={{ duration: 0.9, delay: delay + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
