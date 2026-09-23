import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/store/PageHero";
import { Reveal, SplitHeading } from "@/components/store/Reveal";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Fragrances by Hameemah blends long-lasting, luxury perfumes and attars for Pakistan — made in small batches with premium oils.",
  alternates: { canonical: "/about" },
};

export default function About() {
  const values = [
    ["Premium oils", "We use high-concentration fragrance oils so every spray lasts for hours, not minutes."],
    ["Small batches", "Each blend is mixed and matured in small batches, then checked by hand before it ships."],
    ["Fair prices", "Luxury shouldn't need a luxury budget. We keep our prices honest and our quality high."],
  ];
  return (
    <>
      <PageHero eyebrow="Our story" title="Luxury in every drop" sub="A love for scent, turned into a house of fragrance." />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal className="relative mx-auto aspect-square w-full max-w-md rounded-[2rem] bg-gradient-to-b from-emerald to-ink p-10">
          <Image src="/brand/logo-full.png" alt="Fragrances by Hameemah logo" fill priority sizes="400px" className="object-contain p-10" />
        </Reveal>
        <div>
          <SplitHeading text="Scent is the most personal thing you wear" className="font-display text-5xl leading-tight" />
          <Reveal delay={0.2}>
            <p className="mt-6 leading-relaxed text-ink/80">Fragrances by Hameemah began with a simple belief: everyone deserves a perfume that makes them feel remarkable — one that lasts through the whole day and draws compliments long after you&apos;ve left the room.</p>
            <p className="mt-4 leading-relaxed text-ink/80">From rich eastern ouds and pure attars to fresh everyday scents, each fragrance is blended with care, matured patiently and bottled in our signature green and gold.</p>
            <Link href="/shop" className="btn-gold mt-8 inline-flex rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">Explore the collection</Link>
          </Reveal>
        </div>
      </section>
      <section className="bg-forest py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
          {values.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.1} className="rounded-3xl border border-gold/20 bg-white/5 p-8">
              <p className="font-display text-5xl text-gold">0{i + 1}</p>
              <p className="mt-4 font-display text-3xl">{t}</p>
              <p className="mt-2 text-cream/65">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
