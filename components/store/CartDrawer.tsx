"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { rs } from "@/lib/format";

export function CartDrawer({ freeOver }: { freeOver: number }) {
  const { open, setOpen, lines, subtotal, setQty, remove, toast } = useCart();
  const left = Math.max(0, freeOver - subtotal);
  const pct = freeOver > 0 ? Math.min(100, (subtotal / freeOver) * 100) : 100;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [setOpen]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              role="dialog"
              aria-label="Shopping bag"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between bg-forest px-6 py-5 text-cream">
                <p className="font-display text-2xl">Your Bag <span className="text-gold">({lines.length})</span></p>
                <button onClick={() => setOpen(false)} aria-label="Close bag" className="rounded-full p-1.5 hover:bg-white/10"><X className="size-6" /></button>
              </div>

              {freeOver > 0 && lines.length > 0 && (
                <div className="border-b border-cream-2 px-6 py-4">
                  <p className="text-sm text-ink/80">
                    {left > 0 ? <>You&apos;re <b className="text-emerald">{rs(left)}</b> away from <b>free delivery</b></> : <>🎉 You&apos;ve unlocked <b className="text-emerald">free delivery</b></>}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-2">
                    <motion.div className="h-full bg-gold-grad" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {lines.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <ShoppingBag className="size-16 text-gold" strokeWidth={1} />
                    </motion.div>
                    <p className="mt-4 font-display text-2xl">Your bag is empty</p>
                    <p className="mt-1 text-sm text-muted">Find a scent that feels like you.</p>
                    <Link href="/shop" onClick={() => setOpen(false)} className="btn-gold mt-6 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-widest">Shop now</Link>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                      {lines.map((l) => (
                        <motion.li key={l.productId + l.size} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0 }} className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm">
                          <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-emerald to-forest">
                            <ProductImage src={l.image} color={l.color} shape={l.shape} name={l.name} sizes="80px" />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex justify-between gap-2">
                              <p className="truncate font-display text-lg leading-tight">{l.name}</p>
                              <button onClick={() => remove(l.productId, l.size)} aria-label={`Remove ${l.name}`} className="text-muted hover:text-red-700"><Trash2 className="size-4" /></button>
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted">{l.size}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center rounded-full border border-cream-2">
                                <button className="p-1.5" onClick={() => setQty(l.productId, l.size, l.qty - 1)} aria-label="Decrease"><Minus className="size-3.5" /></button>
                                <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                                <button className="p-1.5" onClick={() => setQty(l.productId, l.size, l.qty + 1)} aria-label="Increase"><Plus className="size-3.5" /></button>
                              </div>
                              <p className="font-semibold text-emerald">{rs(l.price * l.qty)}</p>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {lines.length > 0 && (
                <div className="border-t border-cream-2 bg-white px-6 py-5">
                  <div className="flex justify-between text-lg"><span>Subtotal</span><b>{rs(subtotal)}</b></div>
                  <p className="mt-1 text-xs text-muted">Delivery & discounts calculated at checkout</p>
                  <Link href="/checkout" onClick={() => setOpen(false)} className="btn-gold mt-4 block rounded-full py-4 text-center text-sm font-bold uppercase tracking-[0.2em]">Checkout · Cash on Delivery</Link>
                  <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm text-muted underline-offset-4 hover:underline">Continue shopping</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-gold/40 bg-forest px-6 py-3 text-sm text-cream shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
