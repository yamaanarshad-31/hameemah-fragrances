import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { BottleBand, Categories, ReviewWall, WhyUs, WordMarquee } from "@/components/home/Sections";
import { HomeCards, ProductTabs } from "@/components/home/ProductTabs";
import { ScentAnatomy } from "@/components/home/ScentAnatomy";
import { ScentFinder } from "@/components/home/ScentFinder";
import { Faq } from "@/components/home/Faq";
import { getCategories, getProducts, getRecentReviews, getSettings } from "@/lib/data";
import { toCard } from "@/lib/card";
import { FAQS } from "@/lib/faqs";
import { BRAND, ld, pageMeta } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Luxury Perfumes in Pakistan",
    description: "Shop long-lasting luxury perfumes for men and women from Fragrances by Hameemah, in 50ml and 100ml bottles. Cash on delivery and fast shipping all over Pakistan.",
    path: "/",
  }),
  title: { absolute: `${BRAND} | Long-Lasting Luxury Perfumes in Pakistan` },
};

export default async function Home() {
  const [settings, cats, all, reviews] = await Promise.all([getSettings(), getCategories(), getProducts({ sort: "popular" }), getRecentReviews(10)]);
  const featured = all.filter((p) => p.featured);
  const heroItems = (featured.length ? featured : all).slice(0, 5).map((p) => ({
    id: p.id, name: p.name, slug: p.slug, tagline: p.tagline ?? "", price: Math.min(...p.variants.map((v) => v.price)),
    image: p.images[0] ?? null, color: p.color ?? "#d4af37", shape: p.shape ?? 0,
  }));
  const sample: Record<number, { color: string | null; shape: number | null }> = {};
  for (const p of all) if (p.categoryId && !sample[p.categoryId]) sample[p.categoryId] = { color: p.color, shape: p.shape };

  // Each product crosses to the client once; tabs and the scent finder refer to it by id (keeps the page payload small).
  const cards = all.map(toCard);
  const bySold = all.filter((p) => p.bestseller);
  const newest = [...all].filter((p) => p.isNew).sort((a, b) => b.createdAt - a.createdAt);
  const tabs = [
    { key: "best", label: "Bestsellers", ids: (bySold.length ? bySold : all).map((p) => p.id) },
    { key: "new", label: "New in", ids: (newest.length ? newest : all).map((p) => p.id) },
    { key: "all", label: "All", ids: all.map((p) => p.id) },
  ];
  const anatomy = all.find((p) => p.featured && p.topNotes) ?? all[0];
  const finder = all.map((p) => ({ id: p.id, categorySlug: p.categorySlug, notes: `${p.topNotes} ${p.heartNotes} ${p.baseNotes}`, longevity: p.longevity, sillage: p.sillage }));
  const freeOver = Number(settings.freeShippingOver) || 0;

  // Store + WebSite markup lives in the store layout; the FAQ is specific to this page.
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(jsonLd)} />
      <Hero items={heroItems} title={settings.heroTitle} subtitle={settings.heroSubtitle} freeOver={freeOver} />
      <WordMarquee />
      <Categories cats={cats} sample={sample} />
      <HomeCards cards={cards}>
        <ProductTabs tabs={tabs} />
        {anatomy && <ScentAnatomy p={{ name: anatomy.name, slug: anatomy.slug, color: anatomy.color, shape: anatomy.shape, topNotes: anatomy.topNotes, heartNotes: anatomy.heartNotes, baseNotes: anatomy.baseNotes }} />}
        <ScentFinder products={finder} />
      </HomeCards>
      <ReviewWall reviews={reviews} />
      <BottleBand />
      <WhyUs freeOver={freeOver} />
      <Faq />
    </>
  );
}
