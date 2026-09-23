"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  image?: string | null;
  color?: string | null;
  shape?: number | null;
};

type Ctx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: CartLine, openDrawer?: boolean) => void;
  reprice: (prices: Record<string, number>) => void;
  setQty: (productId: number, size: string, qty: number) => void;
  remove: (productId: number, size: string) => void;
  clear: () => void;
  wishlist: number[];
  toggleWish: (id: number) => void;
  toast: string | null;
  notify: (msg: string) => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "hf_cart_v1";
const WKEY = "hf_wish_v1";

function load<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
    setLines(load(KEY, []));
    setWishlist(load(WKEY, []));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines, loaded]);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(WKEY, JSON.stringify(wishlist)); } catch {}
  }, [wishlist, loaded]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  const add = useCallback((l: CartLine, openDrawer = true) => {
    setLines((prev) => {
      const i = prev.findIndex((x) => x.productId === l.productId && x.size === l.size);
      if (i === -1) return [...prev, l];
      const next = [...prev];
      next[i] = { ...next[i], qty: Math.min(20, next[i].qty + l.qty), price: l.price };
      return next;
    });
    if (openDrawer) setOpen(true);
  }, []);

  /** prices keyed by `${productId}|${size}`; lines no longer on sale are dropped */
  const reprice = useCallback((prices: Record<string, number>) => {
    setLines((prev) => prev.filter((l) => prices[`${l.productId}|${l.size}`] !== undefined).map((l) => ({ ...l, price: prices[`${l.productId}|${l.size}`] })));
  }, []);

  const setQty = useCallback((productId: number, size: string, qty: number) => {
    setLines((prev) => prev.map((x) => (x.productId === productId && x.size === size ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)));
  }, []);
  const remove = useCallback((productId: number, size: string) => {
    setLines((prev) => prev.filter((x) => !(x.productId === productId && x.size === size)));
  }, []);
  const clear = useCallback(() => setLines([]), []);
  const toggleWish = useCallback((id: number) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }, []);

  const value = useMemo<Ctx>(() => {
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
    return { lines, ready: loaded, count, subtotal, open, setOpen, add, reprice, setQty, remove, clear, wishlist, toggleWish, toast, notify };
  }, [lines, loaded, open, add, reprice, setQty, remove, clear, wishlist, toggleWish, toast, notify]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
