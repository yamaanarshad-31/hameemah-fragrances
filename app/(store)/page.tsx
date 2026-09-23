import { Hero } from "@/components/home/Hero";
import { Categories, GiftBand, ReviewWall, WhyUs, WordMarquee } from "@/components/home/Sections";
import { ProductTabs } from "@/components/home/ProductTabs";
import { ScentAnatomy } from "@/components/home/ScentAnatomy";
import { ScentFinder } from "@/components/home/ScentFinder";
import { Faq } from "@/components/home/Faq";
import { getCategories, getProducts, getRecentReviews, getSettings } from "@/lib/data";
import { toCard } from "@/lib/card";
import { FAQS } from "@/lib/faqs";
import { SITE_URL } from "@/lib/site";

export default async function Home() {
  const [settings, cats, all, reviews] = await Promise.all([getSettings(), getCategories(), getProducts({ sort: "popular" }), getRecentReviews(10)]);
  const featured = all.filter((p) => p.featured);
  const heroItems = (featured.length ? featured : all).slice(0, 5).map((p) => ({
    id: p.id, name: p.name, slug: p.slug, tagline: p.tagline ?? "", price: Math.min(...p.variants.map((v) => v.price)),
    image: p.images[0] ?? null, color: p.color ?? "#d4af37", shape: p.shape ?? 0,
  }));
  const sample: Record<number, { color: string | null; shape: number | null }> = {};
  for (const p of all) if (p.categoryId && !sample[p.categoryId]) sample[p.categoryId] = { color: p.color, shape: p.shape };

  const bySold = all.filter((p) => p.bestseller);
  const newest = [...all].filter((p) => p.isNew).sort((a, b) => b.createdAt - a.createdAt);
  const tabs = [
    { key: "best", label: "Bestsellers", items: (bySold.length ? bySold : all).map(toCard) },
    { key: "new", label: "New in", items: (newest.length ? newest : all).map(toCard) },
    { key: "all", label: "All", items: all.map(toCard) },
  ];
  const anatomy = all.find((p) => p.featured && p.topNotes && p.categorySlug !== "gift-sets") ?? all[0];
  const finder = all.map((p) => ({ ...toCard(p), categorySlug: p.categorySlug, notes: `${p.topNotes} ${p.heartNotes} ${p.baseNotes}`, longevity: p.longevity, sillage: p.sillage }));
  const freeOver = Number(settings.freeShippingOver) || 0;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fragrances by Hameemah",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-full.png`,
      sameAs: [settings.instagram, settings.facebook, settings.tiktok].filter((u) => u && !/\.com\/?$/.test(u)),
      contactPoint: { "@type": "ContactPoint", telephone: settings.phone, contactType: "customer service", areaServed: "PK" },
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Fragrances by Hameemah", url: SITE_URL, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero items={heroItems} title={settings.heroTitle} subtitle={settings.heroSubtitle} freeOver={freeOver} />
      <WordMarquee />
      <Categories cats={cats} sample={sample} />
      <ProductTabs tabs={tabs} />
      {anatomy && <ScentAnatomy p={anatomy} />}
      <ScentFinder products={finder} />
      <ReviewWall reviews={reviews} />
      <GiftBand />
      <WhyUs freeOver={freeOver} />
      <Faq />
    </>
  );
}
