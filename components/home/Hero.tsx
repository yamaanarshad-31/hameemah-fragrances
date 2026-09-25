"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Truck, Wallet } from "lucide-react";
import { GoldDust } from "./GoldDust";
import { ProductImage } from "@/components/store/ProductImage";
import { isMouse, useLite } from "@/components/store/useLite";
import { rs } from "@/lib/format";

export type HeroItem = { id: number; name: string; slug: string; tagline: string; price: number; image: string | null; color: string; shape: number };

const ease = [0.2, 0.8, 0.2, 1] as const;

export function Hero({ items, title, subtitle, freeOver }: { items: HeroItem[]; title: string; subtitle: string; freeOver: number }) {
  const [i, setI] = useState(0);
  const cur = items[i % Math.max(1, items.length)];
  const lite = useLite();

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4800);
    return () => clearInterval(t);
  }, [items.length]);

  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 700], [0, 160]);
  const yBottle = useTransform(scrollY, [0, 700], [0, -90]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 90, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 90, damping: 18 });
  const glowX = useSpring(useTransform(mx, [-1, 1], [-40, 40]), { stiffness: 60, damping: 20 });

  const words = title.split(" ");

  return (
    <section
      className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-ink pt-24 text-cream"
      onPointerMove={(e) => {
        if (!isMouse(e)) return;
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      {/* colour wash follows the perfume on show: soft gradients cross-fade (no blur filter to repaint while scrolling) */}
      <AnimatePresence initial={false}>
        <motion.div key={cur?.id ?? 0} className="absolute right-[-35%] top-[-10%] size-[100vmax] rounded-full lg:right-[-10%] lg:size-[80vmax]" style={{ background: `radial-gradient(circle, ${cur?.color ?? "#d4af37"}80 0%, transparent 62%)` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6 }} />
      </AnimatePresence>
      <div className="absolute bottom-[-45%] left-[-45%] size-[110vmax] rounded-full bg-[radial-gradient(circle,rgba(15,61,42,.85)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,.12),transparent_55%)]" />
      <GoldDust density={90} />
      {/* light rays (desktop only: blurred layers animating every frame are too heavy for phones) */}
      <div className="pointer-events-none absolute right-[8%] top-0 hidden h-full w-[45%] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] lg:block">
        {[0, 1, 2].map((k) => (
          // CSS keyframes (transform + opacity) run on the compositor instead of the main thread every frame
          <span key={k} className="hero-ray absolute top-[-10%] h-[120%] w-24 origin-top bg-gradient-to-b from-gold-2/40 to-transparent blur-2xl" style={{ left: `${20 + k * 25}%`, ["--r0" as string]: `${k * 6 - 8}deg`, ["--r1" as string]: `${k * 6 - 2}deg`, animationDuration: `${7 + k * 2}s` }} />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 pb-16 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <motion.div style={lite ? undefined : { y: yText, opacity: fade }} className="relative z-10 text-center lg:text-left">
          <p style={{ ["--i" as string]: 0 }} className="hero-in eyebrow inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-2 text-gold-2 backdrop-blur">
            <Sparkles className="size-3.5" /> Luxury perfumes<span className="hidden sm:inline"> · Made for Pakistan</span>
          </p>
          <h1 className="mt-6 font-display text-[3.2rem] font-medium leading-[0.95] sm:text-7xl lg:text-[5.6rem]" aria-label={title}>
            {words.map((w, k) => (
              <span key={k} className="inline-block overflow-hidden pb-2 align-bottom" aria-hidden>
                <span className={`hero-word inline-block ${k >= words.length - 2 ? "italic text-gold-shine" : ""}`} style={{ ["--i" as string]: 0.15 + k * 0.08 }}>
                  {w}&nbsp;
                </span>
              </span>
            ))}
          </h1>
          <p style={{ ["--i" as string]: 0.6 }} className="hero-in mx-auto mt-6 max-w-lg text-base leading-relaxed text-cream/70 sm:text-lg lg:mx-0">
            {subtitle}
          </p>
          <div style={{ ["--i" as string]: 0.75 }} className="hero-in mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/shop" className="btn-gold group inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">
              Shop the collection <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="#scent-finder" className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em]">
              Find my scent
            </Link>
          </div>
          <ul style={{ ["--i" as string]: 1 }} className="hero-in mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs uppercase tracking-[0.16em] text-cream/60 lg:justify-start">
            <li className="flex items-center gap-2"><Wallet className="size-4 text-gold" /> Cash on delivery</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-gold" /> Free delivery over {rs(freeOver)}</li>
            <li className="flex items-center gap-2"><Sparkles className="size-4 text-gold" /> Long-lasting</li>
          </ul>
        </motion.div>

        {cur && (
          <motion.div style={lite ? undefined : { y: yBottle }} className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[34rem]">
           <div style={{ ["--i" as string]: 0.2 }} className="hero-pop absolute inset-0">
            {/* rotating monogram ring */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full animate-spin-slow text-gold/50" aria-hidden>
              <defs><path id="ring" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" /></defs>
              <circle cx="200" cy="200" r="188" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 6" />
              <text fontFamily="var(--font-cinzel)" fontSize="13" letterSpacing="7" fill="currentColor">
                <textPath href="#ring">FRAGRANCES BY HAMEEMAH ✦ LUXURY IN EVERY DROP ✦ FRAGRANCES BY HAMEEMAH ✦ </textPath>
              </text>
            </svg>
            <motion.div style={{ x: glowX }} className="absolute inset-[18%] rounded-full blur-3xl" animate={{ backgroundColor: `${cur.color}88` }} transition={{ duration: 1.5 }} />
            <div className="absolute inset-[14%] rounded-full border border-gold/25 bg-gradient-to-b from-white/[.06] to-transparent" />

            <motion.div style={lite ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }} className="absolute inset-0">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={cur.id}
                  initial={lite ? { opacity: 0, y: 40, scale: 0.9 } : { opacity: 0, y: 60, scale: 0.85, filter: "blur(10px)" }}
                  animate={lite ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={lite ? { opacity: 0, y: -30, scale: 1.04 } : { opacity: 0, y: -40, scale: 1.05, filter: "blur(10px)" }}
                  transition={{ duration: 1, ease }}
                  className="absolute inset-[6%] animate-float"
                >
                  <Link href={`/product/${cur.slug}`} aria-label={cur.name} className="relative block h-full w-full">
                    <ProductImage src={cur.image} color={cur.color} shape={cur.shape} name={cur.name} priority sizes="(max-width:1024px) 90vw, 40vw" className={cur.image ? "rounded-full" : ""} />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* floating product chip */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={cur.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.6, delay: 0.3 }} className="absolute bottom-[2%] right-0 max-w-[13rem] rounded-2xl border border-gold/25 bg-ink/85 p-3.5 text-left shadow-2xl sm:bottom-[4%] sm:right-[-4%] sm:max-w-[15rem] sm:p-4 lg:bg-ink/70 lg:backdrop-blur-xl">
                <p className="eyebrow !text-[0.6rem] text-gold">Now showing</p>
                <p className="mt-1 font-display text-xl leading-tight sm:text-2xl">{cur.name}</p>
                <p className="line-clamp-1 text-xs text-cream/60">{cur.tagline}</p>
                <Link href={`/product/${cur.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gold-2 hover:gap-2">
                  from {rs(cur.price)} <ArrowRight className="size-3.5 transition-all" />
                </Link>
              </motion.div>
            </AnimatePresence>

            <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 flex-col sm:-left-2">
              {items.map((it, k) => (
                <button key={it.id} onClick={() => setI(k)} aria-label={`Show ${it.name}`} aria-current={k === i % items.length} className="group/dot flex h-9 w-7 items-center justify-center">
                  <span className={`h-7 w-1 rounded-full transition-colors ${k === i % items.length ? "bg-gold" : "bg-cream/25 group-hover/dot:bg-cream/50"}`} />
                </button>
              ))}
            </div>
           </div>
          </motion.div>
        )}
      </div>

      <motion.div style={{ opacity: fade }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.4em] text-cream/40 sm:flex">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-cream/15"><span className="hero-scroll-dot absolute inset-x-0 top-0 h-4 bg-gold" /></span>
      </motion.div>
    </section>
  );
}
