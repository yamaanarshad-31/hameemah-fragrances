import "server-only";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb, schema as s } from "./db";
import { DEFAULT_SETTINGS } from "./db/seed";
import type { Product } from "./db/schema";

export type Settings = typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select().from(s.settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) (out as Record<string, string>)[r.key] = r.value;
  return out;
}

export async function getCategories() {
  const db = await getDb();
  return db.select().from(s.categories).orderBy(asc(s.categories.sort), asc(s.categories.name));
}

export async function getCategory(slug: string) {
  const db = await getDb();
  const [c] = await db.select().from(s.categories).where(eq(s.categories.slug, slug));
  return c ?? null;
}

export type ProductWithRating = Product & { rating: number; reviewCount: number; categorySlug: string | null; categoryName: string | null };

async function withMeta(list: Product[]): Promise<ProductWithRating[]> {
  if (!list.length) return [];
  const db = await getDb();
  const ids = list.map((p) => p.id);
  const stats = await db
    .select({ productId: s.reviews.productId, avg: sql<number>`avg(${s.reviews.rating})`, n: sql<number>`count(*)` })
    .from(s.reviews)
    .where(and(inArray(s.reviews.productId, ids), eq(s.reviews.approved, true)))
    .groupBy(s.reviews.productId);
  const cats = await db.select().from(s.categories);
  return list.map((p) => {
    const st = stats.find((x) => x.productId === p.id);
    const c = cats.find((x) => x.id === p.categoryId);
    return { ...p, rating: st ? Number(st.avg) : 0, reviewCount: st ? Number(st.n) : 0, categorySlug: c?.slug ?? null, categoryName: c?.name ?? null };
  });
}

export type ShopQuery = { category?: string; q?: string; sort?: string; flag?: "featured" | "bestseller" | "new"; limit?: number; ids?: number[] };

export async function getProducts(opts: ShopQuery = {}) {
  const db = await getDb();
  const where = [eq(s.products.active, true)];
  if (opts.category) {
    const c = await getCategory(opts.category);
    if (!c) return [];
    where.push(eq(s.products.categoryId, c.id));
  }
  if (opts.q) {
    const q = `%${opts.q}%`;
    where.push(or(like(s.products.name, q), like(s.products.tagline, q), like(s.products.topNotes, q), like(s.products.heartNotes, q), like(s.products.baseNotes, q))!);
  }
  if (opts.flag === "featured") where.push(eq(s.products.featured, true));
  if (opts.flag === "bestseller") where.push(eq(s.products.bestseller, true));
  if (opts.flag === "new") where.push(eq(s.products.isNew, true));
  if (opts.ids) where.push(inArray(s.products.id, opts.ids.length ? opts.ids : [-1]));

  const order =
    opts.flag === "bestseller" || opts.sort === "popular" ? [desc(s.products.sold)] : [desc(s.products.createdAt)];
  let rows = await db.select().from(s.products).where(and(...where)).orderBy(...order);
  if (opts.sort === "price-asc" || opts.sort === "price-desc") {
    const p = (x: Product) => Math.min(...x.variants.map((v) => v.price));
    rows = rows.sort((a, b) => (opts.sort === "price-asc" ? p(a) - p(b) : p(b) - p(a)));
  }
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return withMeta(rows);
}

export async function getProduct(slug: string) {
  const db = await getDb();
  const [p] = await db.select().from(s.products).where(and(eq(s.products.slug, slug), eq(s.products.active, true)));
  if (!p) return null;
  const [m] = await withMeta([p]);
  const reviews = await db
    .select()
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, p.id), eq(s.reviews.approved, true)))
    .orderBy(desc(s.reviews.createdAt));
  return { product: m, reviews };
}

export async function getRecentReviews(limit = 8) {
  const db = await getDb();
  return db
    .select({ id: s.reviews.id, name: s.reviews.name, city: s.reviews.city, rating: s.reviews.rating, body: s.reviews.body, product: s.products.name, slug: s.products.slug })
    .from(s.reviews)
    .innerJoin(s.products, eq(s.reviews.productId, s.products.id))
    .where(eq(s.reviews.approved, true))
    .orderBy(desc(s.reviews.rating), desc(s.reviews.createdAt))
    .limit(limit);
}

export async function getOrderPublic(orderNo: string, phone?: string) {
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.orderNo, orderNo.trim().toUpperCase()));
  if (!o) return null;
  if (phone !== undefined && o.phone.replace(/\D/g, "").slice(-10) !== phone.replace(/\D/g, "").slice(-10)) return null;
  return o;
}

/** Newest approved review per product — a new review changes the page, so it counts as an update. */
export async function getLatestReviewDates() {
  const db = await getDb();
  const rows = await db
    .select({ productId: s.reviews.productId, at: sql<number>`max(${s.reviews.createdAt})` })
    .from(s.reviews)
    .where(eq(s.reviews.approved, true))
    .groupBy(s.reviews.productId);
  return new Map(rows.map((r) => [r.productId, Number(r.at)]));
}
