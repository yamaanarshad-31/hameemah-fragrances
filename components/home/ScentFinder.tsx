"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Sparkles } from "lucide-react";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";
import { useHomeCards } from "./ProductTabs";

/** Scoring data only; the card itself comes from the shared home-page products. */
type P = { id: number; categorySlug: string | null; notes: string; longevity: number | null; sillage: number | null };

const Q = [
  { q: "Who is it for?", a: [{ k: "men", l: "For him", e: "🤵" }, { k: "women", l: "For her", e: "👗" }, { k: "any", l: "Anyone", e: "✨" }] },
  { q: "Which mood speaks to you?", a: [{ k: "fresh", l: "Fresh & clean", e: "🌊" }, { k: "floral", l: "Soft & floral", e: "🌹" }, { k: "warm", l: "Warm & sweet", e: "🍯" }, { k: "smoky", l: "Deep & smoky", e: "🔥" }] },
  { q: "When will you wear it most?", a: [{ k: "day", l: "Every day", e: "☀️" }, { k: "night", l: "Evenings out", e: "🌙" }, { k: "event", l: "Weddings & events", e: "💍" }] },
];

const MOOD: Record<string, string[]> = {
  fresh: ["bergamot", "lemon", "grapefruit", "marine", "mint", "sea", "apple", "vetiver", "neroli", "sage"],
  floral: ["rose", "jasmine", "peony", "iris", "tuberose", "lychee", "cotton", "musk"],
  warm: ["amber", "vanilla", "honey", "cinnamon", "tonka", "benzoin", "sandalwood", "saffron"],
  smoky: ["leather", "birch", "smoke", "patchouli", "cedar", "pepper", "oakmoss"],
};

export function ScentFinder({ products }: { products: P[] }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<string[]>([]);
  const done = step >= Q.length;
  const cards = useHomeCards();

  const results = useMemo(() => {
    if (!done) return [];
    const [who, mood, when] = ans;
    return products
      .map((p) => {
        let s = 0;
        const cat = p.categorySlug;
        if (who === "men") s += cat === "men" ? 4 : cat === "unisex" ? 2 : cat === "women" ? -5 : 0;
        if (who === "women") s += cat === "women" ? 4 : cat === "unisex" ? 2 : cat === "men" ? -5 : 0;
        const n = p.notes.toLowerCase();
        s += (MOOD[mood] || []).filter((w) => n.includes(w)).length * 2;
        if (when === "day") s += (p.sillage ?? 3) <= 3 ? 2 : 0;
        if (when === "night") s += (p.sillage ?? 3) >= 4 ? 2 : 0;
        if (when === "event") s += (p.longevity ?? 3) >= 5 ? 3 : 0;
        return { p, s };
      })
      .sort((a, b) => b.s - a.s)
      .map((x) => cards.get(x.p.id))
      .filter((c): c is CardProduct => !!c)
      .slice(0, 3);
  }, [done, ans, products, cards]);

  const pick = (k: string) => { setAns((a) => [...a.slice(0, step), k]); setStep((s) => s + 1); };
  const reset = () => { setAns([]); setStep(0); };

  return (
    <section id="scent-finder" className="relative scroll-mt-20 overflow-hidden bg-forest py-20 text-cream sm:py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(21,82,56,.9),transparent_50%)]" />
      <div className="relative mx-auto max-w-5xl px-5 text-center">
        <p className="eyebrow flex items-center justify-center gap-2 text-gold"><Sparkles className="size-4" /> Scent finder</p>
        <h2 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Not sure what to choose? <i className="text-gold-shine">Let us help.</i></h2>

        {!done && (
          <div className="mx-auto mt-10 flex max-w-xs gap-2">
            {Q.map((_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-cream/15">
                <motion.span className="block h-full bg-gold" initial={false} animate={{ width: i < step ? "100%" : i === step ? "35%" : "0%" }} />
              </span>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={step} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.45 }} className="mt-10">
              <p className="font-display text-3xl">{Q[step].q}</p>
              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4">
                {Q[step].a.map((a) => (
                  <motion.button key={a.k} whileHover={{ y: -6 }} whileTap={{ scale: 0.96 }} onClick={() => pick(a.k)} className="w-[calc(50%-0.375rem)] rounded-3xl border border-gold/25 bg-white/5 px-3 py-5 transition-colors hover:border-gold hover:bg-gold/10 active:border-gold active:bg-gold/10 sm:w-44 sm:px-6 sm:py-7">
                    <span className="text-3xl sm:text-4xl">{a.e}</span>
                    <span className="mt-2.5 block text-xs font-semibold uppercase tracking-[0.12em] sm:mt-3 sm:text-sm sm:tracking-[0.14em]">{a.l}</span>
                  </motion.button>
                ))}
              </div>
              {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="mt-6 min-h-11 px-4 text-sm text-cream/60 underline-offset-4 hover:underline sm:mt-8">← Back</button>}
            </motion.div>
          ) : (
            <motion.div key="res" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
              <p className="font-display text-3xl">Your perfect matches</p>
              {/* phones: a swipeable row; larger screens: three columns */}
              <div className="scroll-row -mx-5 mt-8 flex scroll-px-5 gap-4 px-5 pb-2 text-left sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0">
                {results.map((p, i) => <div key={p.id} className="w-[68%] shrink-0 sm:w-auto"><ProductCard p={p} index={i} dark eager /></div>)}
              </div>
              <button onClick={reset} className="mt-8 inline-flex min-h-11 items-center gap-2 px-4 text-sm text-gold-2 hover:text-gold sm:mt-10"><RotateCcw className="size-4" /> Start again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
