"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Gift, Plus } from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { discountPct, rs } from "@/lib/format";
import { GIFT_SIZE, giftLineId } from "@/lib/pricing";
import type { GiftSetView } from "@/lib/data";

export function GiftCard({ g, index = 0 }: { g: GiftSetView; index?: number }) {
  const { add } = useCart();
  const inStock = g.stock > 0;
  const off = discountPct(g.price, g.worth);
  return (
    <motion.article
      id={g.slug}
      initial={index < 3 ? false : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className="group flex scroll-mt-28 flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_20px_50px_-30px_rgba(10,10,9,.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 38%, #b8860b55, transparent 60%), linear-gradient(180deg,#2b2925,#0a0a09)" }} />
        <ProductImage src={g.image} name={g.name} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={index < 3} className="transition duration-[900ms] ease-out group-hover:scale-[1.05]" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald"><Gift className="size-3.5" /> Gift set</span>
          {off > 0 && <span className="rounded-full bg-gold-grad px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink">-{off}%</span>}
          {!inStock && <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-cream">Sold out</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-display text-[1.75rem] leading-tight text-ink">{g.name}</h2>
        {g.description && <p className="mt-1 text-sm text-muted">{g.description}</p>}
        <p className="eyebrow mt-4 !text-[0.6rem] text-gold-3">Inside the box</p>
        <ul className="mt-1.5 space-y-1 text-sm">
          {g.parts.map((x, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3">
              <Link href={`/product/${x.slug}`} className="min-w-0 truncate underline-offset-4 hover:text-gold-3 hover:underline">{x.name}</Link>
              <span className="shrink-0 text-xs uppercase tracking-wider text-muted">{x.size}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-5">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-3xl font-semibold text-emerald">{rs(g.price)}</span>
            {off > 0 && <s className="text-sm text-muted">{rs(g.worth)}</s>}
          </p>
          <button
            disabled={!inStock}
            onClick={() => add({ productId: giftLineId(g.id), giftId: g.id, slug: g.slug, name: g.name, size: GIFT_SIZE, price: g.price, qty: 1, image: g.image })}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald text-sm font-bold uppercase tracking-[0.16em] text-cream transition hover:bg-emerald-2 active:scale-[.98] disabled:opacity-50"
          >
            {inStock ? <><Plus className="size-4" /> Add to bag</> : "Sold out"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
