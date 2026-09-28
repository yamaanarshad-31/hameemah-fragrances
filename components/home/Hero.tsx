"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight, Sparkles, Truck, Wallet } from "lucide-react";
import { GoldDust } from "./GoldDust";
import { isMouse, useLite } from "@/components/store/useLite";
import { rs } from "@/lib/format";

/**
 * Where the bottle sits in each hero photo, in % of the photo. Both photos are crops of the
 * brand's design image: desktop = x 720–1600, y 95–688; phone = x 840–1360, y 95–688. The bottle
 * there spans x 1001–1200, y 179–561. The glint and glow overlays are placed with these numbers,
 * so the photo box keeps the photo's own aspect ratio (no object-cover cropping).
 */
const SCENES = {
  desktop: { src: "/photos/hero-scene.webp", ratio: 880 / 593, bottle: { left: 31.93, top: 14.17, width: 22.61, height: 64.42 } },
  phone: { src: "/photos/hero-scene-mobile.webp", ratio: 520 / 593, bottle: { left: 30.96, top: 14.17, width: 38.27, height: 64.42 } },
};

/** The photo plus the life on top of it: a glow that breathes behind the glass, a light sweep across it, twinkling bokeh. */
function Scene({ kind, sizes }: { kind: keyof typeof SCENES; sizes: string }) {
  const { src, bottle: b } = SCENES[kind];
  const box = { left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` };
  return (
    <>
      <Image src={src} alt="" fill priority sizes={sizes} className="object-fill" />
      <span className="hero-bloom absolute" style={{ left: `${b.left - b.width * 0.5}%`, top: `${b.top}%`, width: `${b.width * 2}%`, height: `${b.height}%` }} />
      <span className="hero-glint absolute" style={box} />
      {[
        [12, 18, 0], [78, 12, 1.4], [88, 44, 2.6], [8, 52, 3.4], [66, 30, 0.8], [94, 70, 2],
      ].map(([x, y, d], k) => (
        <span key={k} className="hero-bokeh absolute" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
      ))}
    </>
  );
}

// soft edges on every side, for screens wider than the photo
const EDGE_FADE: React.CSSProperties = {
  maskImage: "linear-gradient(to right, black 86%, transparent), linear-gradient(to bottom, transparent, black 8%, black 90%, transparent)",
  maskComposite: "intersect",
  WebkitMaskImage: "linear-gradient(to right, black 86%, transparent), linear-gradient(to bottom, transparent, black 8%, black 90%, transparent)",
  WebkitMaskComposite: "source-in",
};

function Parallax({ x, y, className, style, children }: { x: MotionValue<number>; y: MotionValue<number>; className: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return <motion.div style={{ ...style, x, y, scale: 1.02 }} className={className}>{children}</motion.div>;
}

/**
 * Home hero, after the brand's own design: the signature bottle on a marble plinth under a gold
 * arch on the right, the headline on the left. The photo melts into the dark green page on its
 * left edge; phones get a bottle-centred crop above the text.
 */
export function Hero({ title, subtitle, freeOver, count, fromPrice }: { title: string; subtitle: string; freeOver: number; count: number; fromPrice: number }) {
  const lite = useLite();
  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 700], [0, 140]);
  const yScene = useTransform(scrollY, [0, 700], [0, 90]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);

  // the scene leans a few pixels toward the cursor, so it reads as a space rather than a flat picture
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-1, 1], [14, -14]), { stiffness: 50, damping: 18 });
  const py = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 50, damping: 18 });

  const words = title.split(" ");

  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0b2015] pt-20 text-cream lg:flex-row lg:items-center lg:pt-24"
      onPointerMove={(e) => {
        if (lite || !isMouse(e)) return;
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      {/* desktop: the photo keeps its own shape, sized by the hero's height and pinned right */}
      <motion.div style={lite ? undefined : { y: yScene }} className="absolute inset-y-0 right-0 hidden w-[68%] lg:block">
        <div className="absolute inset-0 overflow-hidden [--h:min(92svh,880px)] [mask-image:linear-gradient(to_right,transparent_0%,black_27%)]">
          {/* The photo is sized by the screen height (capped, it is only so sharp) and placed so the bottle's
              centre (43.2% across the photo) lands at 62% of the screen width, clear of the headline. */}
          <Parallax x={px} y={py} className="absolute" style={{ height: "var(--h)", top: "calc(50% - var(--h) / 2 + 1.5rem)", left: `calc(30vw - ${(0.432 * SCENES.desktop.ratio).toFixed(3)} * var(--h))` }}>
            <div className="relative h-full" style={{ aspectRatio: SCENES.desktop.ratio, ...EDGE_FADE }}>
              <div className="hero-scene absolute inset-0">
                <Scene kind="desktop" sizes="(min-width:1024px) 95vw, 10px" />
              </div>
            </div>
          </Parallax>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b2015] to-transparent" />
        {/* a real shop card beside the plinth */}
        <Link
          href="/shop"
          style={{ ["--i" as string]: 1.1 }}
          className="hero-in group absolute bottom-[14%] right-[6%] z-10 flex items-center gap-4 rounded-2xl border border-gold/30 bg-[#07170f]/70 py-3.5 pl-4 pr-3 backdrop-blur-md transition hover:border-gold/60"
        >
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-gold/30">
            <Image src="/photos/bottle-detail.webp" alt="" fill sizes="56px" className="object-cover" />
          </span>
          <span>
            <span className="eyebrow block !text-[0.6rem] text-gold">The signature bottle</span>
            <span className="mt-1 block font-display text-xl leading-tight">{count} scents · 50ml &amp; 100ml</span>
            {fromPrice > 0 && <span className="text-sm text-cream/70">from {rs(fromPrice)}</span>}
          </span>
          <span className="ml-2 flex size-10 items-center justify-center rounded-full bg-gold text-ink transition group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
        </Link>
      </motion.div>

      {/* phones and tablets: bottle-centred crop above the text */}
      <div className="pointer-events-none relative -mt-2 w-full overflow-hidden lg:hidden" style={{ aspectRatio: SCENES.phone.ratio }}>
        <div className="hero-scene absolute inset-0">
          <Scene kind="phone" sizes="(max-width:1023px) 100vw, 10px" />
        </div>
        <div className="absolute inset-x-0 -bottom-px h-1/2 bg-gradient-to-t from-[#0b2015] via-[#0b2015]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0b2015] to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(212,175,55,.08),transparent_55%)]" />
      <GoldDust density={70} />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8 lg:pb-24">
        <motion.div style={lite ? undefined : { y: yText, opacity: fade }} className="relative z-10 -mt-24 text-center sm:-mt-32 lg:mt-0 lg:max-w-[40rem] lg:text-left">
          <p style={{ ["--i" as string]: 0 }} className="hero-in eyebrow inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/20 px-4 py-2 text-gold-2 backdrop-blur">
            <Sparkles className="size-3.5" /> Luxury perfumes<span className="hidden sm:inline"> · Made for Pakistan</span>
          </p>
          <h1 className="mt-6 font-display text-[3.1rem] font-medium leading-[0.95] sm:text-7xl lg:text-[5.4rem]" aria-label={title}>
            {words.map((w, k) => (
              <span key={k} className="inline-block overflow-hidden pb-2 align-bottom" aria-hidden>
                <span className={`hero-word inline-block ${k >= words.length - 2 ? "italic text-gold-shine" : ""}`} style={{ ["--i" as string]: 0.15 + k * 0.08 }}>
                  {w}&nbsp;
                </span>
              </span>
            ))}
          </h1>
          <p style={{ ["--i" as string]: 0.6 }} className="hero-in mx-auto mt-6 max-w-lg text-base leading-relaxed text-cream/75 sm:text-lg lg:mx-0">
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
          <ul style={{ ["--i" as string]: 1 }} className="hero-in mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs uppercase tracking-[0.16em] text-cream/65 lg:justify-start">
            <li className="flex items-center gap-2"><Wallet className="size-4 text-gold" /> Cash on delivery</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-gold" /> Free delivery over {rs(freeOver)}</li>
            <li className="flex items-center gap-2"><Sparkles className="size-4 text-gold" /> Long-lasting</li>
          </ul>
        </motion.div>
      </div>

      <motion.div style={{ opacity: fade }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.4em] text-cream/40 sm:flex">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-cream/15"><span className="hero-scroll-dot absolute inset-x-0 top-0 h-4 bg-gold" /></span>
      </motion.div>
    </section>
  );
}
