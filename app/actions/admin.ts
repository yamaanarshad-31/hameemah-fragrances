"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray, like, sql } from "drizzle-orm";
import { getDb, schema as s, type DB } from "@/lib/db";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { slugify, STATUSES } from "@/lib/format";
import { ATTAR_SLUG, FEATURE_KEY, FEATURES, type Feature } from "@/lib/data";
import { cleanDay } from "@/lib/pricing";

const refresh = () => revalidatePath("/", "layout");

// ---- auth ----
// Failed sign-ins per client IP + email. In memory, so each serverless instance keeps its own count;
// keying on the IP stops a stranger from locking the real admin out by typing their email.
const attempts = new Map<string, { n: number; at: number }>();
const WINDOW = 10 * 60_000;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip")?.trim() || "";
}

export async function login(_: unknown, form: FormData) {
  const email = String(form.get("email") || "");
  const key = `${(await clientIp()) || "?"}|${email.trim().toLowerCase()}`;
  const now = Date.now();
  for (const [k, v] of attempts) if (now - v.at >= WINDOW) attempts.delete(k); // keep the map from growing forever
  const a = attempts.get(key);
  if (a && a.n >= 5) return { error: "Too many attempts. Please wait 10 minutes.", email };
  if (!checkCredentials(email, String(form.get("password") || ""))) {
    attempts.set(key, { n: (a?.n ?? 0) + 1, at: now });
    return { error: "Wrong email or password.", email };
  }
  attempts.delete(key);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---- products ----
const variant = z.object({ size: z.string().trim().min(1).max(30), price: z.coerce.number().int().min(0), salePrice: z.coerce.number().int().min(0).nullable().optional(), stock: z.coerce.number().int().min(0) });
const day = z.string().max(10).default("").transform(cleanDay);
const DATES_WRONG = "The end date is before the start date";
const productSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(90).optional().default(""),
  tagline: z.string().trim().max(140).default(""),
  description: z.string().trim().max(3000).default(""),
  categoryId: z.coerce.number().int().nullable(),
  concentration: z.string().trim().max(40).default("Eau de Parfum"),
  topNotes: z.string().trim().max(200).default(""),
  heartNotes: z.string().trim().max(200).default(""),
  baseNotes: z.string().trim().max(200).default(""),
  longevity: z.coerce.number().int().min(1).max(5),
  sillage: z.coerce.number().int().min(1).max(5),
  variants: z.array(variant).min(1, "Add at least one size"),
  images: z.array(z.string().max(300)).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#b8860b"),
  shape: z.coerce.number().int().min(0).max(3),
  featured: z.boolean(), bestseller: z.boolean(), isNew: z.boolean(), active: z.boolean(),
  salePercent: z.coerce.number().int().min(0).max(90, "A sale can be at most 90% off").default(0),
  saleStart: day, saleEnd: day,
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const r = productSchema.safeParse(input);
  if (!r.success) return { ok: false as const, error: r.error.issues[0]?.message ?? "Please check the form" };
  const { id, ...d } = r.data;
  if (new Set(d.variants.map((v) => v.size.toLowerCase())).size !== d.variants.length) return { ok: false as const, error: "Two sizes have the same name" };
  if (d.saleStart && d.saleEnd && d.saleEnd < d.saleStart) return { ok: false as const, error: DATES_WRONG };
  const low = d.variants.find((v) => v.salePrice != null && v.salePrice >= v.price);
  if (low && !d.salePercent) return { ok: false as const, error: `The sale price for ${low.size} must be lower than its regular price` };
  const variants = d.variants.map(({ salePrice, ...v }) => (salePrice != null && salePrice < v.price ? { ...v, salePrice } : v));
  const db = await getDb();
  let slug = slugify(d.slug || d.name) || `perfume-${Date.now()}`;
  const clash = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, slug));
  if (clash.some((c) => c.id !== id)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const row = { ...d, slug, variants };
  let newId = id;
  if (id) await db.update(s.products).set(row).where(eq(s.products.id, id));
  else newId = (await db.insert(s.products).values({ ...row, createdAt: Date.now() }).returning({ id: s.products.id }))[0].id;
  refresh();
  return { ok: true as const, id: newId!, slug };
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [p] = await db.select({ images: s.products.images }).from(s.products).where(eq(s.products.id, id));
  await db.delete(s.reviews).where(eq(s.reviews.productId, id));
  await db.delete(s.products).where(eq(s.products.id, id));
  // drop uploaded photos nobody else uses (past orders keep showing the drawn bottle)
  const others = (await db.select({ images: s.products.images }).from(s.products)).flatMap((x) => x.images);
  const orphans = (p?.images ?? []).filter((u) => u.startsWith("/api/img/") && !others.includes(u)).map((u) => u.slice(9));
  if (orphans.length) await db.delete(s.images).where(inArray(s.images.id, orphans));
  refresh();
}

export async function toggleProduct(id: number, field: "active" | "featured" | "bestseller" | "isNew", value: boolean) {
  await requireAdmin();
  const db = await getDb();
  await db.update(s.products).set({ [field]: value }).where(eq(s.products.id, id));
  refresh();
}

// ---- orders ----
/** Puts an order's stock, "sold" count and coupon use back (sign 1) or takes them again (sign -1). */
/** The bottles an order line took from stock: the perfume itself, or each perfume inside a gift set. */
const bottles = (it: s.OrderItem) => (it.parts ? it.parts.map((x) => ({ productId: x.productId, size: x.size, qty: it.qty })) : [{ productId: it.productId, size: it.size, qty: it.qty }]);

async function restock(db: DB, o: s.Order, sign: 1 | -1) {
  for (const it of o.items.flatMap(bottles)) {
    const [p] = await db.select().from(s.products).where(eq(s.products.id, it.productId));
    if (!p) continue;
    await db.update(s.products).set({
      variants: p.variants.map((v) => (v.size === it.size ? { ...v, stock: Math.max(0, v.stock + sign * it.qty) } : v)),
      sold: Math.max(0, (p.sold ?? 0) - sign * it.qty),
    }).where(eq(s.products.id, p.id));
  }
  if (o.coupon) await db.update(s.coupons).set({ uses: sql`max(0, ${s.coupons.uses} - ${sign})` }).where(eq(s.coupons.code, o.coupon));
}

export async function setOrderStatus(id: number, status: string) {
  await requireAdmin();
  if (!(STATUSES as readonly string[]).includes(status)) return;
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) return;
  // put stock back if an order is cancelled (and take it again if un-cancelled)
  if ((status === "cancelled") !== (o.status === "cancelled")) await restock(db, o, status === "cancelled" ? 1 : -1);
  await db.update(s.orders).set({ status }).where(eq(s.orders.id, id));
  refresh();
}

export async function deleteOrder(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  // a live order still holds stock — hand it back, just like cancelling would
  // (demo orders never took any stock, same as "Remove demo orders")
  if (o && o.status !== "cancelled" && !o.orderNo.startsWith("DEMO-")) await restock(db, o, 1);
  await db.delete(s.orders).where(eq(s.orders.id, id));
  refresh();
  redirect("/admin/orders");
}

export async function removeDemoOrders() {
  await requireAdmin();
  const db = await getDb();
  await db.delete(s.orders).where(like(s.orders.orderNo, "DEMO-%"));
  // the starter "sold" counters were sample numbers too — start counting from real orders
  await db.update(s.products).set({ sold: 0 });
  const real = await db.select().from(s.orders);
  for (const o of real) {
    if (o.status === "cancelled") continue;
    for (const it of o.items.flatMap(bottles)) await db.update(s.products).set({ sold: sql`${s.products.sold} + ${it.qty}` }).where(eq(s.products.id, it.productId));
  }
  refresh();
}

// ---- categories ----
export async function saveCategory(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id")) || undefined;
  const name = String(form.get("name") || "").trim().slice(0, 40);
  if (!name) return;
  const row = {
    name,
    slug: slugify(String(form.get("slug") || "") || name),
    blurb: String(form.get("blurb") || "").trim().slice(0, 80),
    color: /^#[0-9a-f]{6}$/i.test(String(form.get("color"))) ? String(form.get("color")) : "#1c1b19",
    sort: Number(form.get("sort")) || 0,
  };
  const db = await getDb();
  const all = await db.select().from(s.categories);
  if (all.some((c) => c.id !== id && (c.slug === row.slug || c.name.toLowerCase() === name.toLowerCase()))) {
    if (!id) return; // already exists — nothing to add
    row.slug = `${row.slug}-${id}`;
  }
  if (id) await db.update(s.categories).set(row).where(eq(s.categories.id, id));
  else await db.insert(s.categories).values(row);
  refresh();
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  const db = await getDb();
  await db.update(s.products).set({ categoryId: null }).where(eq(s.products.categoryId, id));
  await db.delete(s.categories).where(eq(s.categories.id, id));
  refresh();
}

// ---- reviews ----
export async function setReviewApproved(id: number, approved: boolean) {
  await requireAdmin();
  const db = await getDb();
  await db.update(s.reviews).set({ approved }).where(eq(s.reviews.id, id));
  refresh();
}
export async function deleteReview(id: number) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(s.reviews).where(eq(s.reviews.id, id));
  refresh();
}

// ---- coupons ----
/** Creates a code, or updates the one with the same name. */
export async function saveCoupon(_: unknown, form: FormData) {
  await requireAdmin();
  const code = String(form.get("code") || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  if (!code) return { ok: false as const, error: "Enter a code using letters and numbers" };
  const amount = Math.floor(Number(form.get("amount")) || 0);
  const isFixed = form.get("kind") === "fixed";
  if (amount < 1) return { ok: false as const, error: "Enter how much the code takes off" };
  if (!isFixed && amount > 90) return { ok: false as const, error: "A code can be at most 90% off" };
  const rawExpiry = String(form.get("expires") || "");
  const expires = cleanDay(rawExpiry);
  if (rawExpiry && !expires) return { ok: false as const, error: "Pick a valid expiry date" };
  const row = { percent: isFixed ? 0 : amount, fixed: isFixed ? Math.min(amount, 1_000_000) : 0, minTotal: Math.max(0, Math.floor(Number(form.get("minTotal")) || 0)), expires };
  const db = await getDb();
  await db.insert(s.coupons).values({ code, ...row }).onConflictDoUpdate({ target: s.coupons.code, set: row });
  refresh();
  return { ok: true as const, code, at: Date.now() };
}
export async function toggleCoupon(id: number, active: boolean) {
  await requireAdmin();
  const db = await getDb();
  await db.update(s.coupons).set({ active }).where(eq(s.coupons.id, id));
  refresh();
}
export async function deleteCoupon(id: number) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(s.coupons).where(eq(s.coupons.id, id));
  refresh();
}

// ---- settings ----
export async function saveSettings(_: unknown, form: FormData) {
  await requireAdmin();
  const db = await getDb();
  // the announcement bar is edited in Store Features, not here
  const keys = ["heroTitle", "heroSubtitle", "whatsapp", "phone", "email", "instagram", "facebook", "tiktok", "shippingFee", "freeShippingOver", "city", "bankDetails"];
  for (const key of keys) {
    let value = String(form.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 600);
    if (key === "whatsapp") value = value.replace(/\D/g, "").replace(/^0/, "92");
    if (key === "shippingFee" || key === "freeShippingOver") value = String(Math.max(0, Number(value) || 0));
    await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  }
  refresh();
  return { ok: true, at: Date.now() };
}

// ---- store features ----
/** The Attar feature is a category with a fixed slug; it is created the first time it is needed. */
export async function ensureAttarCategory() {
  await requireAdmin();
  const db = await getDb();
  const [c] = await db.select().from(s.categories).where(eq(s.categories.slug, ATTAR_SLUG));
  if (c) return c.id;
  const [{ n }] = await db.select({ n: sql<number>`coalesce(max(${s.categories.sort}), 0)` }).from(s.categories);
  const [row] = await db.insert(s.categories).values({ name: "Attar", slug: ATTAR_SLUG, blurb: "Pure perfume oils", color: "#5a3d12", sort: Number(n) + 1 }).returning({ id: s.categories.id });
  return row.id;
}

/** Turns a feature on or off. Nothing is deleted: an "off" feature is only hidden from the store. */
export async function setFeature(feature: Feature, on: boolean) {
  await requireAdmin();
  if (!FEATURES.includes(feature)) return { ok: false as const };
  if (feature === "attar" && on) await ensureAttarCategory();
  const db = await getDb();
  const value = on ? "1" : "0";
  await db.insert(s.settings).values({ key: FEATURE_KEY[feature], value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  refresh();
  return { ok: true as const, on };
}

async function putSettings(values: Record<string, string>) {
  const db = await getDb();
  for (const [key, value] of Object.entries(values)) await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
}

const announcementSchema = z.object({ messages: z.array(z.string().max(160)).max(8), start: day, end: day });
export async function saveAnnouncement(input: z.input<typeof announcementSchema>) {
  await requireAdmin();
  const r = announcementSchema.safeParse(input);
  if (!r.success) return { ok: false as const, error: "Each message can be up to 160 characters (8 messages at most)" };
  // "|" separates the messages in storage, so it can't be part of one
  const messages = r.data.messages.map((m) => m.replace(/\|/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!messages.length) return { ok: false as const, error: "Add at least one message — or turn the bar off instead" };
  if (r.data.start && r.data.end && r.data.end < r.data.start) return { ok: false as const, error: DATES_WRONG };
  await putSettings({ announcement: messages.join(" | "), announcementStart: r.data.start, announcementEnd: r.data.end });
  refresh();
  return { ok: true as const };
}

const quickSaleSchema = z.object({ percent: z.coerce.number().int().min(0).max(90), start: day, end: day });
/** Sets a % off for every size of a product (0 = no % sale). Per-size sale prices are edited on the product page. */
export async function setProductSale(id: number, input: z.input<typeof quickSaleSchema>) {
  await requireAdmin();
  const r = quickSaleSchema.safeParse(input);
  if (!r.success) return { ok: false as const, error: "Enter a discount between 1 and 90%" };
  if (r.data.start && r.data.end && r.data.end < r.data.start) return { ok: false as const, error: DATES_WRONG };
  const db = await getDb();
  await db.update(s.products).set({ salePercent: r.data.percent, saleStart: r.data.start, saleEnd: r.data.end }).where(eq(s.products.id, id));
  refresh();
  return { ok: true as const };
}

/** Takes a product off sale completely: the % and every size's sale price. */
export async function clearProductSale(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [p] = await db.select({ variants: s.products.variants }).from(s.products).where(eq(s.products.id, id));
  if (!p) return { ok: false as const, error: "Product not found" };
  await db.update(s.products).set({ salePercent: 0, saleStart: "", saleEnd: "", variants: p.variants.map((v) => ({ size: v.size, price: v.price, stock: v.stock })) }).where(eq(s.products.id, id));
  refresh();
  return { ok: true as const };
}

const giftSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(2, "Give the gift set a name").max(80),
  description: z.string().trim().max(600).default(""),
  image: z.string().max(300).default(""),
  items: z.array(z.object({ productId: z.number().int().positive(), size: z.string().min(1).max(30) })).min(1, "Add at least one perfume to the set").max(10, "A set can hold up to 10 perfumes"),
  price: z.coerce.number().int().min(1, "Enter the price of the set").max(10_000_000),
  active: z.boolean().default(true),
});
export type GiftSetInput = z.input<typeof giftSchema>;

export async function saveGiftSet(input: GiftSetInput) {
  await requireAdmin();
  const r = giftSchema.safeParse(input);
  if (!r.success) return { ok: false as const, error: r.error.issues[0]?.message ?? "Please check the form" };
  const { id, ...d } = r.data;
  const db = await getDb();
  const prods = await db.select({ id: s.products.id, variants: s.products.variants }).from(s.products).where(inArray(s.products.id, d.items.map((i) => i.productId)));
  if (d.items.some((i) => !prods.find((p) => p.id === i.productId)?.variants.some((v) => v.size === i.size))) return { ok: false as const, error: "One of the perfumes or sizes no longer exists — please pick it again" };
  let slug = slugify(d.name) || `gift-${Date.now()}`;
  const clash = await db.select({ id: s.giftSets.id }).from(s.giftSets).where(eq(s.giftSets.slug, slug));
  if (clash.some((c) => c.id !== id)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  let newId = id;
  if (id) await db.update(s.giftSets).set({ ...d, slug }).where(eq(s.giftSets.id, id));
  else newId = (await db.insert(s.giftSets).values({ ...d, slug, createdAt: Date.now() }).returning({ id: s.giftSets.id }))[0].id;
  refresh();
  return { ok: true as const, id: newId! };
}

export async function toggleGiftSet(id: number, active: boolean) {
  await requireAdmin();
  const db = await getDb();
  await db.update(s.giftSets).set({ active }).where(eq(s.giftSets.id, id));
  refresh();
  return { ok: true as const };
}

export async function deleteGiftSet(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [g] = await db.select({ image: s.giftSets.image }).from(s.giftSets).where(eq(s.giftSets.id, id));
  await db.delete(s.giftSets).where(eq(s.giftSets.id, id));
  // drop its uploaded photo unless something else still shows it (past orders fall back to the house bottle)
  if (g?.image?.startsWith("/api/img/")) {
    const used = [...(await db.select({ image: s.giftSets.image }).from(s.giftSets)).map((x) => x.image), ...(await db.select({ images: s.products.images }).from(s.products)).flatMap((x) => x.images)];
    if (!used.includes(g.image)) await db.delete(s.images).where(eq(s.images.id, g.image.slice(9)));
  }
  refresh();
}

export async function saveGiftWrapFee(fee: number) {
  await requireAdmin();
  if (!Number.isFinite(fee) || fee < 0 || fee > 100_000) return { ok: false as const, error: "Enter a charge of Rs. 0 or more" };
  await putSettings({ giftWrapFee: String(Math.floor(fee)) });
  refresh();
  return { ok: true as const };
}
