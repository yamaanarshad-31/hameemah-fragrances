"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Check, Heart, Minus, Plus, Share2, ShieldCheck, Star, Truck, Wallet, Zap } from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { isMouse, useLite } from "./useLite";
import { discountPct, rs } from "@/lib/format";
import type { Variant } from "@/lib/db/schema";

type P = {
  id: number; name: string; slug: string; tagline: string | null; description: string | null; concentration: string | null;
  variants: Variant[]; images: string[]; color: string | null; shape: number | null; rating: number; reviewCount: number;
  longevity: number | null; sillage: number | null; categoryName: string | null;
};

function Meter({ label, value, words }: { label: string; value: number; words: string[] }) {
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-[0.16em]"><span className="text-muted">{label}</span><span className="font-semibold text-emerald">{words[value - 1]}</span></div>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((k) => (
          <motion.span key={k} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: k * 0.08 }} className={`h-1.5 flex-1 origin-left rounded-full ${k <= value ? "bg-gold-grad" : "bg-cream-2"}`} />
        ))}
      </div>
    </div>
  );
}

export function ProductView({ p, whatsapp }: { p: P; whatsapp: string }) {
  const router = useRouter();
  const { add, wishlist, toggleWish, notify } = useCart();
  const firstIn = p.variants.findIndex((v) => v.stock > 0);
  const [vi, setVi] = useState(firstIn === -1 ? 0 : firstIn);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [added, setAdded] = useState(false);
  const v = p.variants[vi];
  const off = discountPct(v.price, v.compareAt);
  const liked = wishlist.includes(p.id);
  const gallery = p.images.length ? p.images : [null];
  const lite = useLite();
  // phones: once the main buttons scroll away, a slim bar keeps "Add to bag" within thumb reach
  const buyRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    // the huge bottom margin makes "below the screen" count as visible, so the bar shows only once the buttons are above it
    const io = new IntersectionObserver(([e]) => setBar(!e.isIntersecting), { rootMargin: "0px 0px 100000px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 150, damping: 18 });

  const line = () => ({ productId: p.id, slug: p.slug, name: p.name, size: v.size, price: v.price, qty, image: p.images[0] ?? null, color: p.color, shape: p.shape });
  const addToBag = () => { add(line()); setAdded(true); setTimeout(() => setAdded(false), 1800); };
  const buyNow = () => { add(line(), false); router.push("/checkout"); };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); notify("Link copied"); }
    } catch {}
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-8 lg:gap-16">
      {/* gallery */}
      <div className="md:sticky md:top-28 md:self-start">
        <motion.div
          onPointerMove={(e) => { if (!isMouse(e)) return; const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height); }}
          onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}
          style={lite ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
          className="relative aspect-square overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-40px_rgba(6,20,13,.7)]"
        >
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 40%, ${p.color}66, transparent 60%), linear-gradient(180deg,#155238,#06140d)` }} />
          <div className="absolute inset-[12%] animate-spin-slow rounded-full border border-dashed border-gold/20" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={img} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.45 }} className="absolute inset-0">
              {/* a photo fills the frame, so it gently breathes instead of floating (floating would show the frame edge) */}
              <div className={`absolute inset-0 ${gallery[img] ? "animate-breathe" : "animate-float"}`}><ProductImage src={gallery[img]} color={p.color} shape={p.shape} name={p.name} alt={`${p.name} – ${p.concentration ?? "perfume"} by Fragrances by Hameemah`} priority sizes="(max-width:1024px) 100vw, 50vw" /></div>
            </motion.div>
          </AnimatePresence>
          {off > 0 && <span className="absolute left-5 top-5 rounded-full bg-gold-grad px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink">Save {off}%</span>}
        </motion.div>
        {gallery.length > 1 && (
          <div className="mt-4 flex gap-3">
            {gallery.map((g, k) => (
              <button key={k} onClick={() => setImg(k)} aria-label={`Image ${k + 1}`} className={`relative size-20 overflow-hidden rounded-xl bg-forest transition ${k === img ? "ring-2 ring-gold" : "opacity-60 hover:opacity-100"}`}>
                <ProductImage src={g} color={p.color} shape={p.shape} name={p.name} sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* details */}
      <div>
        <p className="eyebrow text-gold-3">{p.categoryName} · {p.concentration}</p>
        <h1 className="mt-3 font-display text-[2.75rem] leading-none text-ink sm:text-6xl">{p.name}</h1>
        <p className="mt-3 text-base text-muted sm:text-lg">{p.tagline}</p>
        {p.reviewCount > 0 && (
          <a href="#reviews" className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm">
            <span className="flex text-gold">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={`size-4 ${k <= Math.round(p.rating) ? "fill-gold" : "opacity-30"}`} />)}</span>
            <span className="text-muted underline-offset-4 hover:underline">{p.rating.toFixed(1)} · {p.reviewCount} review{p.reviewCount > 1 ? "s" : ""}</span>
          </a>
        )}

        <div className="mt-6 flex items-baseline gap-3">
          <AnimatePresence mode="popLayout">
            <motion.span key={v.price} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="font-display text-4xl font-semibold text-emerald">{rs(v.price)}</motion.span>
          </AnimatePresence>
          {v.compareAt ? <s className="text-lg text-muted">{rs(v.compareAt)}</s> : null}
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em]">Size</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.variants.map((x, k) => (
              <button key={x.size} disabled={x.stock <= 0} onClick={() => { setVi(k); setQty(1); }} className={`relative min-w-24 rounded-2xl border px-5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${k === vi ? "border-emerald bg-emerald text-cream" : "border-ink/15 bg-white hover:border-emerald"}`}>
                <span className="block font-semibold">{x.size}</span>
                <span className={`text-xs ${k === vi ? "text-gold-2" : "text-muted"}`}>{x.stock <= 0 ? "Sold out" : rs(x.price)}</span>
              </button>
            ))}
          </div>
          {v.stock > 0 && v.stock <= 5 && <p className="mt-3 text-sm font-semibold text-red-700">Hurry — only {v.stock} left</p>}
        </div>

        <div ref={buyRef} className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-ink/15 bg-white">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3.5" aria-label="Decrease quantity"><Minus className="size-4" /></button>
            <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(v.stock, 20, q + 1))} className="p-3.5" aria-label="Increase quantity"><Plus className="size-4" /></button>
          </div>
          <button onClick={addToBag} disabled={v.stock <= 0} className="relative flex min-w-44 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald py-4 text-sm font-bold uppercase tracking-[0.16em] text-cream transition hover:bg-emerald-2 active:scale-[.98] disabled:opacity-50 sm:min-w-48 sm:tracking-[0.2em]">
            <AnimatePresence mode="wait" initial={false}>
              {added ? <motion.span key="a" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2"><Check className="size-4" /> Added</motion.span>
                : <motion.span key="b" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}>{v.stock <= 0 ? "Sold out" : "Add to bag"}</motion.span>}
            </AnimatePresence>
          </button>
          <button onClick={() => { toggleWish(p.id); notify(liked ? "Removed from wishlist" : "Saved to wishlist ♥"); }} aria-label="Wishlist" aria-pressed={liked} className="flex size-14 items-center justify-center rounded-full border border-ink/15 bg-white transition hover:border-gold">
            <Heart className={`size-5 ${liked ? "fill-gold text-gold" : ""}`} />
          </button>
          <button onClick={share} aria-label="Share" className="flex size-14 items-center justify-center rounded-full border border-ink/15 bg-white transition hover:border-gold"><Share2 className="size-5" /></button>
        </div>
        <button onClick={buyNow} disabled={v.stock <= 0} className="btn-gold mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 text-[0.8rem] font-bold uppercase tracking-[0.1em] disabled:opacity-50 sm:text-sm sm:tracking-[0.2em]">
          <Zap className="size-4 shrink-0" /> Buy it now — Cash on delivery
        </button>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I want to order ${p.name} (${v.size}).`)}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex min-h-11 items-center justify-center text-sm font-semibold text-emerald underline-offset-4 hover:underline">
          Or order on WhatsApp →
        </a>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs sm:mt-8 sm:gap-3">
          {[[Wallet, "Cash on delivery"], [Truck, "2–4 day delivery"], [ShieldCheck, "Easy exchange"]].map(([I, t]) => {
            const Icon = I as typeof Wallet;
            return <div key={t as string} className="rounded-2xl bg-cream-2/60 px-2 py-3 sm:p-3"><Icon className="mx-auto size-5 text-gold-3" /><p className="mt-1.5 font-semibold">{t as string}</p></div>;
          })}
        </div>

        <div className="mt-6 space-y-5 rounded-3xl border border-ink/10 bg-white p-5 sm:mt-8 sm:p-6">
          <Meter label="Longevity" value={p.longevity ?? 3} words={["2–3 hrs", "3–5 hrs", "5–7 hrs", "7–10 hrs", "10+ hrs"]} />
          <Meter label="Projection" value={p.sillage ?? 3} words={["Skin-close", "Soft", "Moderate", "Strong", "Room-filling"]} />
        </div>

        <p className="mt-8 leading-relaxed text-ink/80">{p.description}</p>
      </div>

      <AnimatePresence>
        {bar && (
          <motion.div
            data-pdp-bar
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream/95 px-4 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-18px_rgba(6,20,13,.45)] lg:hidden"
          >
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight">{p.name}</p>
                <p className="text-sm font-semibold text-emerald">{v.size} · {rs(v.price)}</p>
              </div>
              <button onClick={addToBag} disabled={v.stock <= 0} className="flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-emerald px-6 text-xs font-bold uppercase tracking-[0.14em] text-cream active:scale-[.97] disabled:opacity-50">
                {added ? <><Check className="size-4" /> Added</> : v.stock <= 0 ? "Sold out" : "Add to bag"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
