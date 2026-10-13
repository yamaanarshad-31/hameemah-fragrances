import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray, isNull, like, ne, or, sql } from "drizzle-orm";
import { getDb, schema as s } from "./db";
import { DEFAULT_SETTINGS } from "./db/seed";
import type { Product } from "./db/schema";
import { inWindow, pricedVariants } from "./pricing";

export type Settings = typeof DEFAULT_SETTINGS;

// Read once per page render: the layout, the page and the product queries all ask for it.
export const getSettings = cache(async (): Promise<Settings> => {
  const db = await getDb();
  const rows = await db.select().from(s.settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) (out as Record<string, string>)[r.key] = r.value;
  return out;
});

// ---- Store Features (Admin → Store Features) ----
// A feature that is off is hidden from the storefront here, in one place; its rows stay in the database.
export const FEATURES = ["announcement", "sale", "gifts", "attar"] as const;
export type Feature = (typeof FEATURES)[number];
export type Features = Record<Feature, boolean>;
export const FEATURE_KEY: Record<Feature, string> = { announcement: "featAnnouncement", sale: "featSale", gifts: "featGifts", attar: "featAttar" };
/** The Attar feature is this one category: its menu link, collection page and products. */
export const ATTAR_SLUG = "attar";

export const featuresOf = (st: Settings): Features => ({
  announcement: st.featAnnouncement === "1",
  sale: st.featSale === "1",
  gifts: st.featGifts === "1",
  attar: st.featAttar === "1",
});
export async function getFeatures() {
  return featuresOf(await getSettings());
}

export const splitMessages = (text: string) => text.split("|").map((m) => m.trim()).filter(Boolean);
/** Announcement messages to show right now — none when the bar is off or outside its dates. */
export function liveAnnouncement(st: Settings) {
  if (st.featAnnouncement !== "1" || !inWindow(st.announcementStart, st.announcementEnd)) return [];
  return splitMessages(st.announcement);
}

const allCategories = cache(async () => {
  const db = await getDb();
  return db.select().from(s.categories).orderBy(asc(s.categories.sort), asc(s.categories.name));
});

/** Categories the storefront shows (Attar only while its feature is on). */
export async function getCategories() {
  const [cats, f] = await Promise.all([allCategories(), getFeatures()]);
  return f.attar ? cats : cats.filter((c) => c.slug !== ATTAR_SLUG);
}

export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
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
  const cats = await allCategories();
  return list.map((p) => {
    const st = stats.find((x) => x.productId === p.id);
    const c = cats.find((x) => x.id === p.categoryId);
    return { ...p, rating: st ? Number(st.avg) : 0, reviewCount: st ? Number(st.n) : 0, categorySlug: c?.slug ?? null, categoryName: c?.name ?? null };
  });
}

export type ShopQuery = { category?: string; q?: string; sort?: string; flag?: "featured" | "bestseller" | "new"; limit?: number; ids?: number[]; onSale?: boolean };

/** Hides Attar products while that feature is off. */
async function visibleOnly() {
  const [cats, f] = await Promise.all([allCategories(), getFeatures()]);
  const attar = cats.find((c) => c.slug === ATTAR_SLUG);
  return !f.attar && attar ? [or(isNull(s.products.categoryId), ne(s.products.categoryId, attar.id))!] : [];
}

/** Products as the storefront sees them: only visible ones, with sale prices already worked out. */
export async function getProducts(opts: ShopQuery = {}) {
  const db = await getDb();
  const f = await getFeatures();
  const where = [eq(s.products.active, true), ...(await visibleOnly())];
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
  let rows = (await db.select().from(s.products).where(and(...where)).orderBy(...order)).map((p) => ({ ...p, variants: pricedVariants(p, f.sale) }));
  if (opts.onSale) rows = rows.filter((p) => p.variants.some((v) => v.compareAt));
  if (opts.sort === "price-asc" || opts.sort === "price-desc") {
    const p = (x: Product) => Math.min(...x.variants.map((v) => v.price));
    rows = rows.sort((a, b) => (opts.sort === "price-asc" ? p(a) - p(b) : p(b) - p(a)));
  }
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return withMeta(rows);
}

export async function getProduct(slug: string) {
  const db = await getDb();
  const [raw] = await db.select().from(s.products).where(and(eq(s.products.slug, slug), eq(s.products.active, true), ...(await visibleOnly())));
  if (!raw) return null;
  const p = { ...raw, variants: pricedVariants(raw, (await getFeatures()).sale) };
  const [m] = await withMeta([p]);
  const reviews = await db
    .select()
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, p.id), eq(s.reviews.approved, true)))
    .orderBy(desc(s.reviews.createdAt));
  return { product: m, reviews };
}

export type GiftSetView = {
  id: number; name: string; slug: string; description: string; image: string | null; price: number;
  /** what the bottles inside cost bought one by one */
  worth: number;
  parts: { productId: number; name: string; slug: string; size: string }[];
  /** how many sets the stock of the bottles inside allows */
  stock: number;
};

/** Gift sets for the storefront. Empty while the Gifts feature is off; a set whose perfume was removed or hidden is left out. */
export async function getGiftSets(): Promise<GiftSetView[]> {
  if (!(await getFeatures()).gifts) return [];
  const db = await getDb();
  const sets = await db.select().from(s.giftSets).where(eq(s.giftSets.active, true)).orderBy(desc(s.giftSets.createdAt));
  if (!sets.length) return [];
  const prods = await getProducts({ ids: [...new Set(sets.flatMap((g) => g.items.map((i) => i.productId)))] });
  const out: GiftSetView[] = [];
  for (const g of sets) {
    const need = new Map<string, number>();
    const parts: GiftSetView["parts"] = [];
    let worth = 0;
    let stock = Infinity;
    for (const it of g.items) {
      const p = prods.find((x) => x.id === it.productId);
      const v = p?.variants.find((x) => x.size === it.size);
      if (!p || !v) { stock = -1; break; }
      const k = `${p.id}|${v.size}`;
      need.set(k, (need.get(k) ?? 0) + 1);
      stock = Math.min(stock, Math.floor(v.stock / need.get(k)!));
      worth += v.price;
      parts.push({ productId: p.id, name: p.name, slug: p.slug, size: v.size });
    }
    if (stock < 0 || !parts.length) continue;
    out.push({ id: g.id, name: g.name, slug: g.slug, description: g.description ?? "", image: g.image || null, price: g.price, worth, parts, stock: Number.isFinite(stock) ? stock : 0 });
  }
  return out;
}

export async function getRecentReviews(limit = 8) {
  const db = await getDb();
  return db
    .select({ id: s.reviews.id, name: s.reviews.name, city: s.reviews.city, rating: s.reviews.rating, body: s.reviews.body, product: s.products.name, slug: s.products.slug })
    .from(s.reviews)
    .innerJoin(s.products, eq(s.reviews.productId, s.products.id))
    .where(and(eq(s.reviews.approved, true), ...(await visibleOnly())))
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
