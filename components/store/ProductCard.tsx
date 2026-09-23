"use client";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Heart, Plus, Star } from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { discountPct, minPrice, rs } from "@/lib/format";
import type { Variant } from "@/lib/db/schema";

export type CardProduct = {
  id: number; name: string; slug: string; tagline: string | null; variants: Variant[]; images: string[];
  color: string | null; shape: number | null; rating: number; reviewCount: number; isNew: boolean | null; bestseller: boolean | null; categoryName?: string | null;
};

export function ProductCard({ p, index = 0, dark = false, eager = false }: { p: CardProduct; index?: number; dark?: boolean; eager?: boolean }) {
  const { add, wishlist, toggleWish, notify } = useCart();
  const v = minPrice(p.variants);
  const off = discountPct(v.price, v.compareAt);
  const inStock = p.variants.some((x) => x.stock > 0);
  const liked = wishlist.includes(p.id);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });

  const quickAdd = () => {
    const first = [...p.variants].filter((x) => x.stock > 0).sort((a, b) => a.price - b.price)[0];
    if (!first) return;
    add({ productId: p.id, slug: p.slug, name: p.name, size: first.size, price: first.price, qty: 1, image: p.images[0] ?? null, color: p.color, shape: p.shape });
  };

  return (
    <motion.article
      initial={eager ? false : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}
        className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] shadow-[0_20px_50px_-25px_rgba(6,20,13,.55)]"
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 38%, ${p.color}55, transparent 60%), linear-gradient(180deg,#155238,#06140d)` }} />
        <div className="absolute inset-x-8 bottom-6 top-6 rounded-full border border-gold/15 transition duration-700 group-hover:scale-110 group-hover:border-gold/40" />
        <Link href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0">
          <ProductImage src={p.images[0]} color={p.color} shape={p.shape} name={p.name} className="transition duration-[900ms] ease-out group-hover:-translate-y-3 group-hover:scale-[1.06]" />
        </Link>
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,.18)_50%,transparent_65%)] transition duration-[1100ms] group-hover:translate-x-full" />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-full bg-gold-grad px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink">-{off}%</span>}
          {p.isNew && <span className="rounded-full bg-cream px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald">New</span>}
          {!inStock && <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-cream">Sold out</span>}
        </div>
        <button
          onClick={() => { toggleWish(p.id); notify(liked ? "Removed from wishlist" : "Saved to wishlist ♥"); }}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-ink/40 text-cream backdrop-blur transition hover:bg-gold hover:text-ink"
        >
          <Heart className={`size-4 ${liked ? "fill-gold text-gold group-hover:text-ink" : ""}`} />
        </button>
        {inStock && (
          <button
            onClick={quickAdd}
            className="absolute inset-x-3 bottom-3 flex translate-y-0 items-center justify-center gap-2 rounded-full bg-cream/95 py-3 text-xs font-bold uppercase tracking-[0.16em] text-ink opacity-100 backdrop-blur transition duration-500 hover:bg-gold md:translate-y-[130%] md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            <Plus className="size-4" /> Quick add
          </button>
        )}
      </motion.div>

      <Link href={`/product/${p.slug}`} className="mt-4 block px-1">
        {p.reviewCount > 0 ? (
          <div className="flex items-center gap-1 text-gold">
            {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 ${i < Math.round(p.rating) ? "fill-gold" : "opacity-30"}`} />)}
            <span className={`ml-1 text-xs ${dark ? "text-cream/50" : "text-muted"}`}>({p.reviewCount})</span>
          </div>
        ) : (
          <p className={`eyebrow !text-[0.6rem] ${dark ? "text-gold/70" : "text-gold-3"}`}>{p.categoryName ?? "Fragrance"}</p>
        )}
        <h3 className={`mt-1 font-display text-2xl leading-tight transition-colors group-hover:text-gold-3 ${dark ? "text-cream" : "text-ink"}`}>{p.name}</h3>
        <p className={`line-clamp-1 text-sm ${dark ? "text-cream/55" : "text-muted"}`}>{p.tagline}</p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className={`font-semibold ${dark ? "text-gold-2" : "text-emerald"}`}>{p.variants.length > 1 ? "From " : ""}{rs(v.price)}</span>
          {v.compareAt ? <s className={`text-sm ${dark ? "text-cream/40" : "text-muted"}`}>{rs(v.compareAt)}</s> : null}
        </p>
      </Link>
    </motion.article>
  );
}
