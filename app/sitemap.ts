import type { MetadataRoute } from "next";
import { getCategories, getLatestReviewDates, getProducts } from "@/lib/data";
import { SITE_URL, abs } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products, reviewed] = await Promise.all([getCategories(), getProducts(), getLatestReviewDates()]);
  // Products have no "updated at" column, so a product's date is its launch or its newest review, whichever is later.
  const touched = new Map(products.map((p) => [p.id, Math.max(p.createdAt, reviewed.get(p.id) ?? 0)]));
  const latest = (ids: number[]) => (ids.length ? new Date(Math.max(...ids.map((id) => touched.get(id) ?? 0))) : undefined);
  const newest = latest(products.map((p) => p.id));

  return [
    { url: SITE_URL, lastModified: newest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    ...cats.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: latest(products.filter((p) => p.categoryId === c.id).map((p) => p.id)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(touched.get(p.id)!),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.length ? p.images.map(abs) : undefined,
    })),
    // Static pages carry no lastModified: a made-up "now" date teaches Google to ignore the field.
    ...["/about", "/contact", "/policies", "/track-order"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly" as const, priority: p === "/track-order" ? 0.3 : 0.5 })),
  ];
}
