import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Gem, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { Stars } from "@/components/store/Stars";
import { Bottle } from "@/components/store/Bottle";
import { Reveal, SplitHeading } from "@/components/store/Reveal";

export function WordMarquee() {
  const words = ["Long Lasting", "Sandalwood", "Vetiver", "Rose", "Musk", "Amber", "Saffron", "Leather", "Jasmine", "Bergamot"];
  return (
    <div className="relative overflow-hidden border-y border-gold/20 bg-forest py-6" style={{ ["--marquee-dur" as string]: "35s" }}>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((k) => (
          <div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center">
            {words.map((w) => (
              <span key={w} className="flex items-center font-display text-4xl italic text-cream/90 sm:text-5xl">
                <span className="px-8">{w}</span>
                <span className="text-2xl not-italic text-gold">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type Cat = { id: number; name: string; slug: string; blurb: string | null; color: string | null };

export function Categories({ cats, sample }: { cats: Cat[]; sample: Record<number, { color: string | null; shape: number | null }> }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-8 lg:py-32">
      <div className="flex flex-col items-center text-center">
        <Reveal><p className="eyebrow text-gold-3">Shop by family</p></Reveal>
        <SplitHeading text="Find the scent that feels like you" className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl" />
      </div>
      {/* phones: two per row, the first one full width when the count is odd; wider screens: one row */}
      <div className={`mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-4 ${cats.length === 4 ? "md:grid-cols-4" : cats.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {cats.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.08} className={i === 0 && cats.length % 2 === 1 ? "col-span-2 md:col-span-1" : ""}>
            <Link href={`/collections/${c.slug}`} className="group relative block h-72 overflow-hidden rounded-[1.6rem] text-cream sm:h-80 lg:h-[26rem]" style={{ background: `linear-gradient(170deg, ${c.color}, #06140d)` }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(243,220,143,.25),transparent_60%)] opacity-60 transition duration-700 group-hover:opacity-100" />
              <div className="absolute inset-x-0 top-8 flex justify-center transition duration-[900ms] ease-out group-hover:-translate-y-4 group-hover:scale-110">
                <Bottle color={sample[c.id]?.color} shape={sample[c.id]?.shape ?? i} name={c.name} className="h-40 w-auto drop-shadow-[0_25px_25px_rgba(0,0,0,.5)] sm:h-44 lg:h-56" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="font-display text-[1.75rem] leading-tight sm:text-3xl">{c.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm text-cream/60">{c.blurb}</p>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition duration-500 group-hover:rotate-45 group-hover:bg-gold group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function WhyUs({ freeOver }: { freeOver: number }) {
  const items = [
    { icon: Clock, t: "Lasts 8–12 hours", d: "High-concentration blends that stay with you from morning to night." },
    { icon: ShieldCheck, t: "Cash on delivery", d: "Pay when your parcel arrives. No advance payment needed." },
    { icon: Truck, t: "Delivery all over Pakistan", d: `Usually 2–4 working days. Free on orders above Rs. ${freeOver.toLocaleString()}.` },
    { icon: RefreshCcw, t: "Easy exchange", d: "Not in love? Exchange within 7 days if the bottle is unused." },
  ];
  return (
    <section className="cv-auto bg-cream-2/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-2 gap-y-4 overflow-hidden px-3 py-14 sm:gap-px sm:px-5 sm:py-20 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, t, d }, i) => (
          <Reveal key={t} delay={(i % 2) * 0.1} className="group p-2 text-center sm:p-6">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-3 transition duration-500 group-hover:-translate-y-1 group-hover:bg-emerald group-hover:text-gold sm:size-16">
              <Icon className="size-6 sm:size-7" strokeWidth={1.4} />
            </span>
            <p className="mt-3 font-display text-xl leading-tight sm:mt-5 sm:text-2xl">{t}</p>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">{d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

type Rev = { id: number; name: string; city: string | null; rating: number; body: string; product: string; slug: string };

export function ReviewWall({ reviews }: { reviews: Rev[] }) {
  if (!reviews.length) return null;
  const rows = [reviews, [...reviews].reverse()];
  return (
    <section className="cv-auto overflow-hidden py-20 sm:py-24 lg:py-32">
      <div className="mb-10 flex flex-col items-center px-5 text-center sm:mb-14">
        <Reveal><p className="eyebrow text-gold-3">Loved across Pakistan</p></Reveal>
        <SplitHeading text="Words from our customers" className="mt-4 font-display text-5xl text-ink sm:text-6xl" />
      </div>
      <div className="space-y-4 sm:space-y-5 sm:[mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex w-max animate-marquee gap-4 will-change-transform hover:[animation-play-state:paused] sm:gap-5" style={{ ["--marquee-dur" as string]: r ? "70s" : "60s", animationDirection: r ? "reverse" : "normal" }}>
            {[...row, ...row].map((v, i) => (
              <figure key={i} aria-hidden={i >= row.length || undefined} className="w-[17.5rem] shrink-0 rounded-3xl border border-cream-2 bg-white p-5 shadow-[0_15px_40px_-25px_rgba(6,20,13,.35)] sm:w-[22rem] sm:p-6">
                <Stars value={v.rating} />
                <blockquote className="mt-3 line-clamp-4 font-display text-lg leading-snug text-ink sm:text-xl">&ldquo;{v.body}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span><b>{v.name}</b>{v.city ? <span className="text-muted"> · {v.city}</span> : null}</span>
                  <Link href={`/product/${v.slug}`} tabIndex={i >= row.length ? -1 : undefined} className="text-right text-xs font-semibold uppercase tracking-wider text-gold-3 hover:underline">{v.product}</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BottleBand() {
  return (
    <section className="cv-auto px-5 lg:px-8">
      <div className="grain relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-emerald px-6 py-14 text-cream sm:px-14 sm:py-16 lg:py-20">
        <div className="absolute -right-40 -top-40 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.22)_0%,transparent_60%)]" />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-gold"><Gem className="size-4" /> Our signature bottle</p>
            <h2 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Crystal cap, <i className="text-gold-shine">gold collar</i></h2>
            <p className="mt-4 max-w-md text-cream/70">Every scent is bottled in faceted octagonal glass, crowned with a cut-crystal cap and a polished gold collar — a bottle you&apos;ll want to keep on show.</p>
            <Link href="/shop" className="btn-gold mt-8 inline-flex rounded-full px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] sm:px-8 sm:tracking-[0.2em]">Shop the collection</Link>
          </Reveal>
          <Reveal delay={0.15} y={80}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.6rem] shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)]">
              <Image src="/photos/bottles-group.webp" alt="Fragrances by Hameemah perfume bottles with crystal caps and gold collars" fill sizes="(max-width:1024px) 90vw, 384px" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
