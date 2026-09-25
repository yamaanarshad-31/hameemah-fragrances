import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/store/PageHero";
import { ShopControls } from "@/components/store/ShopControls";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getCategories, getCategory, getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";
import { SeoCopy } from "@/components/store/SeoCopy";
import { categoryCopy } from "@/lib/seo-copy";
import { SITE_URL, abs, ld, pageMeta } from "@/lib/site";

export async function generateMetadata({ params, searchParams }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  const copy = categoryCopy(c);
  const meta = pageMeta({ title: copy.title, description: copy.description, path: `/collections/${c.slug}` });
  return typeof (await searchParams).q === "string" ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function Collection({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getCategory(slug);
  if (!c) notFound();
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const [cats, items] = await Promise.all([getCategories(), getProducts({ category: slug, q, sort })]);
  const copy = categoryCopy(c);
  const url = `${SITE_URL}/collections/${c.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: copy.title,
      url,
      description: copy.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/product/${p.slug}`), name: p.name })) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name: c.name, item: url },
      ],
    },
  ];
  return (
    <>
      {!q && <script type="application/ld+json" dangerouslySetInnerHTML={ld(jsonLd)} />}
      <PageHero eyebrow="Collection" title={c.name} sub={c.blurb ?? undefined} color={c.color} />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Suspense>
          <ShopControls cats={cats} active={slug} count={items.length} />
        </Suspense>
        <h2 className="sr-only">{q ? `Results for “${q}”` : `${c.name} perfumes`}</h2>
        <ProductGrid items={items.map(toCard)} />
      </div>
      {!q && <SeoCopy copy={copy} links={[{ name: "All perfumes", href: "/shop" }, ...cats.filter((x) => x.slug !== c.slug).map((x) => ({ name: x.name, href: `/collections/${x.slug}` }))]} />}
    </>
  );
}
