import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/store/PageHero";
import { ShopControls } from "@/components/store/ShopControls";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategories, getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";
import { SeoCopy } from "@/components/store/SeoCopy";
import { SHOP_COPY } from "@/lib/seo-copy";
import { SITE_URL, abs, ld, pageMeta } from "@/lib/site";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const meta = pageMeta({ title: SHOP_COPY.title, description: SHOP_COPY.description, path: "/shop" });
  // Search results are thin, near-duplicate pages: keep them out of the index but let links be followed.
  return typeof (await searchParams).q === "string" ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const [cats, items] = await Promise.all([getCategories(), getProducts({ q, sort })]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: SHOP_COPY.title,
      url: `${SITE_URL}/shop`,
      description: SHOP_COPY.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/product/${p.slug}`), name: p.name })) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ],
    },
  ];
  return (
    <>
      {!q && <script type="application/ld+json" dangerouslySetInnerHTML={ld(jsonLd)} />}
      <PageHero eyebrow="The collection" title="All Fragrances" sub="Every scent we make — from fresh everyday favourites to deep, smoky ouds." />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Suspense>
          <ShopControls cats={cats} count={items.length} />
        </Suspense>
        <h2 className="sr-only">{q ? `Results for “${q}”` : "All perfumes"}</h2>
        <ProductGrid items={items.map(toCard)} />
      </div>
      {!q && <SeoCopy copy={SHOP_COPY} links={cats.map((c) => ({ name: c.name, href: `/collections/${c.slug}` }))} />}
    </>
  );
}
