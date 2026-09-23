"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { FAQS } from "@/lib/faqs";


export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-4xl px-5 py-24 lg:py-32">
      <p className="eyebrow text-center text-gold-3">Questions</p>
      <h2 className="mt-4 text-center font-display text-5xl text-ink sm:text-6xl">Good to know</h2>
      <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
        {FAQS.map((f, i) => (
          <div key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="font-display text-2xl text-ink">{f.q}</span>
              <motion.span animate={{ rotate: open === i ? 45 : 0 }} className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${open === i ? "border-emerald bg-emerald text-gold" : "border-ink/20"}`}>
                <Plus className="size-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                  <p className="max-w-2xl pb-6 leading-relaxed text-muted">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
