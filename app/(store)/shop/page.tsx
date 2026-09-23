import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/store/PageHero";
import { ShopControls } from "@/components/store/ShopControls";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategories, getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";

export const metadata: Metadata = {
  title: "Shop All Perfumes",
  description: "Browse every perfume, oud and attar from Fragrances by Hameemah. Long-lasting luxury scents with cash on delivery across Pakistan.",
  alternates: { canonical: "/shop" },
};

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const [cats, items] = await Promise.all([getCategories(), getProducts({ q, sort })]);
  return (
    <>
      <PageHero eyebrow="The collection" title="All Fragrances" sub="Every scent we make — from fresh everyday favourites to deep, smoky ouds." />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Suspense>
          <ShopControls cats={cats} count={items.length} />
        </Suspense>
        <ProductGrid items={items.map(toCard)} />
      </div>
    </>
  );
}
