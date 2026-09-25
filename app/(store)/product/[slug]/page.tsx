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
import { isSampleReview } from "@/lib/db/seed";
import { BRAND, SITE_URL, STORE_ID, abs, clip, ld, pageMeta } from "@/lib/site";

/** "Eau de Parfum" → "EDP" etc. for tighter titles. */
const shortConc = (c: string | null) => ({ "Eau de Parfum": "EDP", "Extrait de Parfum": "Extrait", "Eau de Toilette": "EDT" })[c ?? ""] ?? c ?? "";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const r = await getProduct((await params).slug);
  if (!r) return {};
  const p = r.product;
  const price = Math.min(...p.variants.map((v) => v.price));
  const raw = shortConc(p.concentration) || "Perfume";
  const kind = p.name.toLowerCase().includes(raw.split(" ")[0].toLowerCase()) ? "" : raw; // avoid doubling a word already in the name

  return pageMeta({
    title: `${[p.name, kind].filter(Boolean).join(" ")} Price in Pakistan`,
    description: clip(`${p.name} by Fragrances by Hameemah: ${p.tagline ? p.tagline.toLowerCase() + ". " : ""}${p.description ?? ""}`, 120) + ` From Rs. ${price.toLocaleString("en-PK")}, cash on delivery in Pakistan.`,
    path: `/product/${p.slug}`,
    images: p.images[0] ? [{ url: p.images[0], alt: `${p.name} — ${p.tagline || p.concentration}` }] : undefined,
  });
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

  // Sample reviews from the seed data are shown on the page but never marked up as real ratings.
  const real = reviews.filter((v) => !isSampleReview(v));
  const url = `${SITE_URL}/product/${p.slug}`;
  const fee = Number(settings.shippingFee) || 0;
  const freeOver = Number(settings.freeShippingOver) || 0;
  const shipping = (price: number) => ({
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: freeOver && price >= freeOver ? 0 : fee, currency: "PKR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4, unitCode: "DAY" },
    },
  });
  const returns = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "PK",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    refundType: "https://schema.org/ExchangeRefund",
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    description: p.description || p.tagline,
    sku: `HF-${p.id}`,
    brand: { "@type": "Brand", name: BRAND },
    ...(p.categoryName ? { category: `Perfume > ${p.categoryName}` } : {}),
    image: p.images.length ? p.images.map(abs) : [`${SITE_URL}/brand/logo-full.png`],
    url,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Concentration", value: p.concentration },
      ...(p.topNotes
        ? [
            { "@type": "PropertyValue", name: "Top notes", value: p.topNotes },
            { "@type": "PropertyValue", name: "Heart notes", value: p.heartNotes },
            { "@type": "PropertyValue", name: "Base notes", value: p.baseNotes },
          ]
        : []),
    ],
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      name: `${p.name} ${v.size}`,
      sku: `HF-${p.id}-${v.size.replace(/\W+/g, "")}`,
      url,
      price: v.price,
      priceCurrency: "PKR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": STORE_ID },
      shippingDetails: shipping(v.price),
      hasMerchantReturnPolicy: returns,
    })),
    ...(real.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (real.reduce((n, v) => n + v.rating, 0) / real.length).toFixed(1),
            reviewCount: real.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: real.slice(0, 5).map((v) => ({
            "@type": "Review",
            author: { "@type": "Person", name: v.name },
            datePublished: new Date(v.createdAt).toISOString().slice(0, 10),
            reviewRating: { "@type": "Rating", ratingValue: v.rating, bestRating: 5, worstRating: 1 },
            reviewBody: v.body,
          })),
        }
      : {}),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(p.categorySlug ? [{ "@type": "ListItem", position: 2, name: p.categoryName, item: `${SITE_URL}/collections/${p.categorySlug}` }] : []),
      { "@type": "ListItem", position: p.categorySlug ? 3 : 2, name: p.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld([jsonLd, crumbs])} />
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs uppercase tracking-[0.16em] text-muted">
          <Link href="/" className="hover:text-emerald">Home</Link>
          {p.categorySlug && <> / <Link href={`/collections/${p.categorySlug}`} className="hover:text-emerald">{p.categoryName}</Link></>}
          {" / "}<span className="text-ink">{p.name}</span>
        </nav>
        <ProductView p={p} whatsapp={settings.whatsapp} />
      </div>

      {p.topNotes && (
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
