import Link from "next/link";
import { ProductCard, type CardProduct } from "./ProductCard";

export function ProductGrid({ items }: { items: CardProduct[] }) {
  if (!items.length)
    return (
      <div className="py-24 text-center">
        <p className="font-display text-4xl">No perfumes found</p>
        <p className="mt-2 text-muted">Try a different search or browse everything.</p>
        <Link href="/shop" className="btn-gold mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold uppercase tracking-widest">View all</Link>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 py-8 sm:gap-x-4 sm:py-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} eager={i < 4} />)}
    </div>
  );
}
