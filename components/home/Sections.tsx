import Link from "next/link";
import { ArrowUpRight, Clock, Gift, RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { Bottle } from "@/components/store/Bottle";
import { Reveal, SplitHeading } from "@/components/store/Reveal";

export function WordMarquee() {
  const words = ["Long Lasting", "Oud", "Attar", "Rose", "Musk", "Amber", "Saffron", "Leather", "Jasmine", "Vetiver"];
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
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="flex flex-col items-center text-center">
        <Reveal><p className="eyebrow text-gold-3">Shop by family</p></Reveal>
        <SplitHeading text="Find the scent that feels like you" className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl" />
      </div>
      <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cats.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.08} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
            <Link href={`/collections/${c.slug}`} className="group relative block h-80 overflow-hidden rounded-[1.6rem] text-cream lg:h-[26rem]" style={{ background: `linear-gradient(170deg, ${c.color}, #06140d)` }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(243,220,143,.25),transparent_60%)] opacity-60 transition duration-700 group-hover:opacity-100" />
              <div className="absolute inset-x-0 top-8 flex justify-center transition duration-[900ms] ease-out group-hover:-translate-y-4 group-hover:scale-110">
                <Bottle color={sample[c.id]?.color} shape={sample[c.id]?.shape ?? i} name={c.name} className="h-44 w-auto drop-shadow-[0_25px_25px_rgba(0,0,0,.5)] lg:h-56" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-3xl">{c.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm text-cream/60">{c.blurb}</p>
                  <span className="flex size-9 items-center justify-center rounded-full border border-gold/40 text-gold transition duration-500 group-hover:rotate-45 group-hover:bg-gold group-hover:text-ink">
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
    <section className="bg-cream-2/60">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden px-5 py-20 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, t, d }, i) => (
          <Reveal key={t} delay={i * 0.1} className="group p-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-3 transition duration-500 group-hover:-translate-y-1 group-hover:bg-emerald group-hover:text-gold">
              <Icon className="size-7" strokeWidth={1.4} />
            </span>
            <p className="mt-5 font-display text-2xl">{t}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{d}</p>
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
    <section className="overflow-hidden py-24 lg:py-32">
      <div className="mb-14 flex flex-col items-center px-5 text-center">
        <Reveal><p className="eyebrow text-gold-3">Loved across Pakistan</p></Reveal>
        <SplitHeading text="Words from our customers" className="mt-4 font-display text-5xl text-ink sm:text-6xl" />
      </div>
      <div className="space-y-5 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex w-max animate-marquee gap-5 hover:[animation-play-state:paused]" style={{ ["--marquee-dur" as string]: r ? "70s" : "60s", animationDirection: r ? "reverse" : "normal" }}>
            {[...row, ...row].map((v, i) => (
              <figure key={i} className="w-[22rem] shrink-0 rounded-3xl border border-cream-2 bg-white p-6 shadow-[0_15px_40px_-25px_rgba(6,20,13,.35)]">
                <div className="flex gap-0.5 text-gold">{Array.from({ length: 5 }, (_, k) => <Star key={k} className={`size-4 ${k < v.rating ? "fill-gold" : "opacity-25"}`} />)}</div>
                <blockquote className="mt-3 line-clamp-4 font-display text-xl leading-snug text-ink">&ldquo;{v.body}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center justify-between text-sm">
                  <span><b>{v.name}</b>{v.city ? <span className="text-muted"> · {v.city}</span> : null}</span>
                  <Link href={`/product/${v.slug}`} className="text-xs font-semibold uppercase tracking-wider text-gold-3 hover:underline">{v.product}</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function GiftBand() {
  return (
    <section className="px-5 lg:px-8">
      <div className="grain relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-emerald px-6 py-16 text-cream sm:px-14 lg:py-20">
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-gold"><Gift className="size-4" /> The perfect gift</p>
            <h2 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Gift boxes that <i className="text-gold-shine">say it all</i></h2>
            <p className="mt-4 max-w-md text-cream/70">Four bestsellers in travel sizes, wrapped in our green-and-gold keepsake box. Add a handwritten note at checkout — we&apos;ll do the rest.</p>
            <Link href="/collections/gift-sets" className="btn-gold mt-8 inline-flex rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">Shop gift sets</Link>
          </Reveal>
          <div className="relative flex h-60 items-end justify-center gap-1 sm:h-80 sm:gap-2">
            {[["#5a2d0c", 0], ["#0f5132", 1], ["#b0415b", 2], ["#8a1f11", 3]].map(([c, s], i) => (
              <Reveal key={i} delay={0.15 * i} y={80}>
                <div className="animate-float" style={{ animationDelay: `${i * 0.6}s` }}>
                  <Bottle color={c as string} shape={s as number} className={`w-auto drop-shadow-[0_25px_25px_rgba(0,0,0,.45)] ${i % 3 === 0 ? "h-44 sm:h-64" : "h-36 sm:h-52"}`} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
