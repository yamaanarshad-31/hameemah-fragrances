import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductView } from "@/components/store/ProductView";
import { ReviewForm } from "@/components/store/ReviewForm";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/store/Reveal";
import { getProduct, getProducts, getSettings } from "@/lib/data";
import { toCard } from "@/lib/card";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const r = await getProduct((await params).slug);
  if (!r) return {};
  const p = r.product;
  const price = Math.min(...p.variants.map((v) => v.price));
  return {
    title: `${p.name} — ${p.tagline}`,
    description: `${p.name}: ${p.description?.slice(0, 120)} From Rs. ${price.toLocaleString()} with cash on delivery across Pakistan.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: `${p.name} | Fragrances by Hameemah`, description: p.tagline ?? undefined, url: `/product/${p.slug}`, images: [p.images[0] ?? "/opengraph-image.jpg"] },
    twitter: { card: "summary_large_image", images: [p.images[0] ?? "/opengraph-image.jpg"] },
  };
}

function Pyramid({ top, heart, base }: { top: string; heart: string; base: string }) {
  const rows = [["Top", top, "The first impression", "w-[60%]"], ["Heart", heart, "The soul of the scent", "w-[80%]"], ["Base", base, "What lingers all day", "w-full"]];
  return (
    <div className="flex flex-col items-center gap-3">
      {rows.map(([t, n, d, w], i) => (
        <Reveal key={t} delay={i * 0.15} className={`${w} rounded-3xl border border-gold/25 bg-gradient-to-b from-emerald to-forest px-6 py-6 text-center text-cream`}>
          <p className="eyebrow text-gold">{t} notes</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl">{n}</p>
          <p className="mt-1 text-xs text-cream/50">{d}</p>
        </Reveal>
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const r = await getProduct(slug);
  if (!r) notFound();
  const { product: p, reviews } = r;
  const [settings, related] = await Promise.all([
    getSettings(),
    p.categorySlug ? getProducts({ category: p.categorySlug, limit: 5 }) : getProducts({ limit: 5 }),
  ]);
  const more = related.filter((x) => x.id !== p.id).slice(0, 4);

  const prices = p.variants.map((v) => v.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: `HF-${p.id}`,
    brand: { "@type": "Brand", name: "Fragrances by Hameemah" },
    image: p.images.length ? p.images.map((i) => (i.startsWith("http") ? i : SITE_URL + i)) : [`${SITE_URL}/brand/logo-full.png`],
    url: `${SITE_URL}/product/${p.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PKR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.reviewCount
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.toFixed(1), reviewCount: p.reviewCount },
          review: reviews.slice(0, 5).map((v) => ({ "@type": "Review", author: { "@type": "Person", name: v.name }, reviewRating: { "@type": "Rating", ratingValue: v.rating }, reviewBody: v.body })),
        }
      : {}),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(p.categorySlug ? [{ "@type": "ListItem", position: 2, name: p.categoryName, item: `${SITE_URL}/collections/${p.categorySlug}` }] : []),
      { "@type": "ListItem", position: p.categorySlug ? 3 : 2, name: p.name, item: `${SITE_URL}/product/${p.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs uppercase tracking-[0.16em] text-muted">
          <Link href="/" className="hover:text-emerald">Home</Link>
          {p.categorySlug && <> / <Link href={`/collections/${p.categorySlug}`} className="hover:text-emerald">{p.categoryName}</Link></>}
          {" / "}<span className="text-ink">{p.name}</span>
        </nav>
        <ProductView p={p} whatsapp={settings.whatsapp} />
      </div>

      {p.topNotes && p.categorySlug !== "gift-sets" && (
        <section className="mx-auto mt-24 max-w-3xl px-5">
          <p className="eyebrow text-center text-gold-3">Fragrance notes</p>
          <h2 className="mb-10 mt-3 text-center font-display text-5xl">The scent pyramid</h2>
          <Pyramid top={p.topNotes ?? ""} heart={p.heartNotes ?? ""} base={p.baseNotes ?? ""} />
        </section>
      )}

      <section id="reviews" className="mx-auto mt-24 grid max-w-7xl scroll-mt-28 gap-10 px-5 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <h2 className="font-display text-5xl">Reviews</h2>
          {p.reviewCount > 0 ? (
            <div className="mt-4 flex items-center gap-4">
              <span className="font-display text-6xl text-emerald">{p.rating.toFixed(1)}</span>
              <div>
                <div className="flex text-gold">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={`size-5 ${k <= Math.round(p.rating) ? "fill-gold" : "opacity-30"}`} />)}</div>
                <p className="text-sm text-muted">Based on {p.reviewCount} review{p.reviewCount > 1 ? "s" : ""}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-muted">No reviews yet — be the first to share your thoughts.</p>
          )}
          <div className="mt-8"><ReviewForm productId={p.id} /></div>
        </div>
        <ul className="space-y-4">
          {reviews.map((v) => (
            <li key={v.id} className="rounded-3xl bg-white p-6 shadow-[0_15px_40px_-30px_rgba(6,20,13,.5)]">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{v.name}{v.city ? <span className="font-normal text-muted"> · {v.city}</span> : null}</p>
                <div className="flex text-gold">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={`size-4 ${k <= v.rating ? "fill-gold" : "opacity-25"}`} />)}</div>
              </div>
              <p className="mt-3 leading-relaxed text-ink/80">{v.body}</p>
              <p className="mt-3 text-xs text-muted">{new Date(v.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
            </li>
          ))}
        </ul>
      </section>

      {more.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <h2 className="font-display text-5xl">You may also love</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {more.map((x, i) => <ProductCard key={x.id} p={toCard(x)} index={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
