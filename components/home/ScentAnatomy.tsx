"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Bottle } from "@/components/store/Bottle";
import { ArrowRight } from "lucide-react";

type P = { name: string; slug: string; color: string | null; shape: number | null; topNotes: string | null; heartNotes: string | null; baseNotes: string | null; description?: string | null };

function Step({ progress, range, label, time, notes, i }: { progress: MotionValue<number>; range: [number, number]; label: string; time: string; notes: string; i: number }) {
  // scroll-driven offsets must stay inside 0..1 or the browser rejects the animation
  const a = Math.max(0, range[0] - 0.08);
  const d = Math.min(1, range[1] + 0.08);
  const opacity = useTransform(progress, [a, range[0], range[1], d], [0.25, 1, 1, 0.25]);
  const x = useTransform(progress, [a, range[0]], [16, 0]);
  // scaleY instead of height: the progress line animates on the compositor, no layout per scroll frame
  const bar = useTransform(progress, range, [0, 1]);
  return (
    <motion.div style={{ opacity, x }} className="relative border-l border-gold/20 py-3.5 pl-5 sm:py-6 sm:pl-8">
      <motion.span style={{ scaleY: bar }} className="absolute left-[-1px] top-0 h-full w-px origin-top bg-gold" />
      <p className="eyebrow !text-[0.62rem] text-gold sm:!text-[0.72rem]">0{i + 1} · {label} <span className="text-cream/40">— {time}</span></p>
      <p className="mt-2 font-display text-[1.65rem] leading-tight text-cream sm:mt-3 sm:text-5xl">{notes}</p>
    </motion.div>
  );
}

export function ScentAnatomy({ p }: { p: P }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.95]);
  const ring = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className="relative h-[260vh] bg-ink text-cream">
      <div className="grain sticky top-0 flex h-[100svh] items-center overflow-hidden pt-[76px] lg:pt-0">
        <div className="absolute left-1/4 top-1/2 size-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${p.color}55 0%, transparent 60%)` }} />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-5 lg:grid-cols-2 lg:px-8">
          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(212,175,55,.15)" strokeWidth=".4" />
              <motion.circle cx="50" cy="50" r="48" fill="none" stroke="#d4af37" strokeWidth=".6" style={{ pathLength: ring }} />
            </svg>
            <motion.div style={{ rotate, scale }} className="absolute inset-[10%] flex items-center justify-center">
              <Bottle color={p.color} shape={p.shape} name={p.name} className="h-full w-auto drop-shadow-[0_40px_40px_rgba(0,0,0,.6)]" />
            </motion.div>
          </div>
          <div>
            <p className="eyebrow text-gold">Anatomy of a scent</p>
            <h2 className="mt-3 font-display text-[2.1rem] leading-[1.1] sm:text-6xl sm:leading-tight">How <i className="text-gold-shine">{p.name}</i> unfolds on your skin</h2>
            <div className="mt-5 sm:mt-8">
              <Step i={0} progress={scrollYProgress} range={[0.05, 0.33]} label="Top notes" time="first 15 min" notes={p.topNotes || ""} />
              <Step i={1} progress={scrollYProgress} range={[0.36, 0.63]} label="Heart notes" time="2–4 hours" notes={p.heartNotes || ""} />
              <Step i={2} progress={scrollYProgress} range={[0.66, 0.95]} label="Base notes" time="all day" notes={p.baseNotes || ""} />
            </div>
            <Link href={`/product/${p.slug}`} className="btn-ghost mt-6 inline-flex max-w-full items-center gap-2 rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:mt-8 sm:px-7 sm:text-sm sm:tracking-[0.18em]">
              Discover {p.name} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
