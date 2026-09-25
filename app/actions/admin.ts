"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray, like, sql } from "drizzle-orm";
import { getDb, schema as s, type DB } from "@/lib/db";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { slugify, STATUSES } from "@/lib/format";

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
const variant = z.object({ size: z.string().trim().min(1).max(30), price: z.coerce.number().int().min(0), compareAt: z.coerce.number().int().min(0).nullable().optional(), stock: z.coerce.number().int().min(0) });
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
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const r = productSchema.safeParse(input);
  if (!r.success) return { ok: false as const, error: r.error.issues[0]?.message ?? "Please check the form" };
  const { id, ...d } = r.data;
  const variants = d.variants.map((v) => ({ ...v, compareAt: v.compareAt && v.compareAt > v.price ? v.compareAt : null }));
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
async function restock(db: DB, o: s.Order, sign: 1 | -1) {
  for (const it of o.items) {
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
    for (const it of o.items) await db.update(s.products).set({ sold: sql`${s.products.sold} + ${it.qty}` }).where(eq(s.products.id, it.productId));
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
    color: /^#[0-9a-f]{6}$/i.test(String(form.get("color"))) ? String(form.get("color")) : "#0f3d2a",
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
export async function saveCoupon(form: FormData) {
  await requireAdmin();
  const code = String(form.get("code") || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  const percent = Math.min(90, Math.max(1, Number(form.get("percent")) || 0));
  if (!code) return;
  const db = await getDb();
  await db.insert(s.coupons).values({ code, percent, minTotal: Number(form.get("minTotal")) || 0 }).onConflictDoUpdate({ target: s.coupons.code, set: { percent, minTotal: Number(form.get("minTotal")) || 0 } });
  refresh();
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
  const keys = ["announcement", "heroTitle", "heroSubtitle", "whatsapp", "phone", "email", "instagram", "facebook", "tiktok", "shippingFee", "freeShippingOver", "city", "bankDetails"];
  for (const key of keys) {
    let value = String(form.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 600);
    if (key === "whatsapp") value = value.replace(/\D/g, "").replace(/^0/, "92");
    if (key === "shippingFee" || key === "freeShippingOver") value = String(Math.max(0, Number(value) || 0));
    await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  }
  refresh();
  return { ok: true, at: Date.now() };
}
