import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/store/PageHero";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getFeatures, getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Perfume Sale in Pakistan",
  description: "Perfumes on sale at Fragrances by Hameemah — long-lasting scents at reduced prices, with cash on delivery all over Pakistan.",
  path: "/sale",
});

export default async function Sale() {
  // the page exists only while the Sale feature is on (Admin → Store Features)
  if (!(await getFeatures()).sale) notFound();
  const items = await getProducts({ onSale: true, sort: "popular" });
  return (
    <>
      <PageHero eyebrow="Limited time" title="Sale" sub="Our perfumes at special prices — while the offer lasts." color="#6b4a12" />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {items.length ? (
          <>
            <p className="pt-8 text-xs uppercase tracking-[0.18em] text-muted">{items.length} fragrance{items.length === 1 ? "" : "s"} on sale</p>
            <h2 className="sr-only">Perfumes on sale</h2>
            <ProductGrid items={items.map(toCard)} />
          </>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-4xl">No offers right now</p>
            <p className="mt-2 text-muted">New offers are added often — browse the full collection meanwhile.</p>
            <Link href="/shop" className="btn-gold mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold uppercase tracking-widest">View all perfumes</Link>
          </div>
        )}
      </div>
    </>
  );
}
