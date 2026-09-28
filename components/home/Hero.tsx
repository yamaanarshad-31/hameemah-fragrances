"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Truck, Wallet } from "lucide-react";
import { GoldDust } from "./GoldDust";
import { useLite } from "@/components/store/useLite";
import { rs } from "@/lib/format";

/**
 * Home hero, after the brand's own design: the signature bottle on a marble plinth under a gold
 * arch (public/photos/hero-scene*.webp) on the right, the headline on the left. The photo melts
 * into the dark green page on its left edge; phones get a bottle-centred crop above the text.
 */
export function Hero({ title, subtitle, freeOver }: { title: string; subtitle: string; freeOver: number }) {
  const lite = useLite();
  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 700], [0, 140]);
  const yScene = useTransform(scrollY, [0, 700], [0, 90]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);

  const words = title.split(" ");

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0b2015] pt-20 text-cream lg:flex-row lg:items-center lg:pt-24">
      {/* the scene: desktop (right side, fades into the page on its left) */}
      <motion.div style={lite ? undefined : { y: yScene }} className="pointer-events-none absolute inset-y-0 right-0 hidden w-[68%] lg:block">
        <div className="hero-scene absolute inset-0 [mask-image:linear-gradient(to_right,transparent_0%,black_32%)]">
          <Image src="/photos/hero-scene.webp" alt="" fill priority sizes="(min-width:1024px) 70vw, 10px" className="object-cover object-[50%_60%]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b2015] to-transparent" />
      </motion.div>
      {/* the scene: phones and tablets (bottle-centred crop above the text) */}
      <div className="pointer-events-none relative -mt-2 aspect-[720/760] w-full lg:hidden">
        <div className="hero-scene absolute inset-0">
          <Image src="/photos/hero-scene-mobile.webp" alt="" fill priority sizes="(max-width:1023px) 100vw, 10px" className="object-cover object-top" />
        </div>
        <div className="absolute inset-x-0 -bottom-px h-1/2 bg-gradient-to-t from-[#0b2015] via-[#0b2015]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0b2015] to-transparent" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(212,175,55,.08),transparent_55%)]" />
      <GoldDust density={70} />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8 lg:pb-24">
        <motion.div style={lite ? undefined : { y: yText, opacity: fade }} className="relative z-10 -mt-16 text-center sm:-mt-24 lg:mt-0 lg:max-w-[40rem] lg:text-left">
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
