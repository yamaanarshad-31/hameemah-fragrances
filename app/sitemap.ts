import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products] = await Promise.all([getCategories(), getProducts()]);
  const now = new Date();
  const pages = ["", "/shop", "/about", "/contact", "/policies", "/track-order"].map((p) => ({
    url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: p === "" || p === "/shop" ? ("daily" as const) : ("monthly" as const), priority: p === "" ? 1 : p === "/shop" ? 0.9 : 0.4,
  }));
  return [
    ...pages,
    ...cats.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.7, images: p.images.length ? p.images.map((i) => (i.startsWith("http") ? i : SITE_URL + i)) : undefined })),
  ];
}
