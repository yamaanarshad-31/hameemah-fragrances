import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/store/PageHero";
import { ShopControls } from "@/components/store/ShopControls";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategories, getCategory, getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  return {
    title: `${c.name} Perfumes`,
    description: `Shop ${c.name.toLowerCase()} perfumes from Fragrances by Hameemah — ${c.blurb?.toLowerCase()}. Long-lasting, cash on delivery all over Pakistan.`,
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default async function Collection({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getCategory(slug);
  if (!c) notFound();
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const [cats, items] = await Promise.all([getCategories(), getProducts({ category: slug, q, sort })]);
  return (
    <>
      <PageHero eyebrow="Collection" title={c.name} sub={c.blurb ?? undefined} color={c.color} />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Suspense>
          <ShopControls cats={cats} active={slug} count={items.length} />
        </Suspense>
        <ProductGrid items={items.map(toCard)} />
      </div>
    </>
  );
}
