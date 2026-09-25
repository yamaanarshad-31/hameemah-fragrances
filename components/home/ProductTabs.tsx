"use client";
import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";

/** Home page products, sent to the browser once and shared by the tabs and the scent finder. */
const Cards = createContext<Map<number, CardProduct>>(new Map());

export function HomeCards({ cards, children }: { cards: CardProduct[]; children: React.ReactNode }) {
  const map = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  return <Cards.Provider value={map}>{children}</Cards.Provider>;
}

export function useHomeCards() {
  return useContext(Cards);
}

export function ProductTabs({ tabs }: { tabs: { key: string; label: string; ids: number[] }[] }) {
  const cards = useHomeCards();
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  const items = tab.ids.map((id) => cards.get(id)).filter((c): c is CardProduct => !!c);
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:pb-24 lg:px-8 lg:pb-32">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <h2 className="font-display text-5xl text-ink sm:text-6xl">Our <i className="text-gold-3">favourites</i></h2>
        <div role="tablist" className="relative flex rounded-full border border-cream-2 bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={t.key === active} onClick={() => setActive(t.key)} className={`relative z-10 min-h-11 rounded-full px-4 text-xs font-bold uppercase tracking-[0.14em] transition-colors sm:px-5 ${t.key === active ? "text-cream" : "text-ink/60 hover:text-ink"}`}>
              {t.key === active && <motion.span layoutId="tab-pill" className="absolute inset-0 -z-10 rounded-full bg-emerald" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab.key} role="tabpanel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-12 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </motion.div>
      </AnimatePresence>
      <div className="mt-14 flex justify-center">
        <Link href="/shop" className="group inline-flex items-center gap-3 rounded-full border border-ink/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-ink transition hover:border-emerald hover:bg-emerald hover:text-cream">
          View all perfumes <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
