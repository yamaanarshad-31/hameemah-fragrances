"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { rs } from "@/lib/format";

type Hit = { id: number; name: string; slug: string; tagline: string; price: number; image: string | null; color: string | null; shape: number | null };

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 80);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        setHits(await r.json());
      } catch {}
      setLoading(false);
    }, term ? 180 : 0);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-ink/95 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-lenis-prevent>
          <div className="mx-auto max-w-4xl px-5 pt-8 sm:pt-16">
            <div className="flex justify-end">
              <button onClick={onClose} className="p-2 text-gold-2" aria-label="Close search"><X className="size-7" /></button>
            </div>
            <motion.label initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 flex items-center gap-4 border-b border-gold/40 pb-4">
              <Search className="size-7 shrink-0 text-gold" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !q.trim()) return;
                  e.preventDefault();
                  router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
                  onClose();
                }}
                enterKeyHint="search"
                placeholder="Search rose, amber, fresh…"
                className="w-full bg-transparent font-display text-3xl text-cream placeholder:text-cream/30 focus:outline-none sm:text-5xl"
                aria-label="Search perfumes"
              />
            </motion.label>
            <p className="mt-4 text-sm text-cream/50">{loading ? "Searching…" : q ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Popular right now"}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 pb-16 sm:grid-cols-4">
              {hits.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/product/${h.slug}`} onClick={onClose} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-b from-emerald to-forest">
                      <ProductImage src={h.image} color={h.color} shape={h.shape} name={h.name} className="transition duration-700 group-hover:scale-105" />
                    </div>
                    <p className="mt-2 font-display text-lg text-cream group-hover:text-gold">{h.name}</p>
                    <p className="text-sm text-gold-2">from {rs(h.price)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
