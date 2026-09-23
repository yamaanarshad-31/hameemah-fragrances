"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { ProductCard, type CardProduct } from "./ProductCard";

export function WishlistView() {
  const { wishlist, ready } = useCart();
  const [fetched, setItems] = useState<CardProduct[] | null>(null);
  useEffect(() => {
    if (!ready || !wishlist.length) return;
    fetch(`/api/products?ids=${wishlist.join(",")}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [wishlist, ready]);
  const items = ready && !wishlist.length ? [] : fetched && fetched.filter((p) => wishlist.includes(p.id));
  if (items === null) return <div className="grid grid-cols-2 gap-4 py-10 lg:grid-cols-4">{[0, 1, 2, 3].map((k) => <div key={k} className="aspect-[4/5] animate-pulse rounded-[1.6rem] bg-cream-2" />)}</div>;
  if (!items.length)
    return (
      <div className="py-20 text-center">
        <p className="font-display text-4xl">Nothing saved yet</p>
        <p className="mt-2 text-muted">Tap the ♥ on any perfume to keep it here.</p>
        <Link href="/shop" className="btn-gold mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold uppercase tracking-widest">Browse perfumes</Link>
      </div>
    );
  return <div className="grid grid-cols-2 gap-x-4 gap-y-10 py-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>;
}
