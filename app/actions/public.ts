"use server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { featuresOf, getGiftSets, getProducts, getSettings, getFeatures } from "@/lib/data";
import { rs } from "@/lib/format";
import { GIFT_SIZE, couponDiscount, giftLineId, inWindow } from "@/lib/pricing";

export async function subscribe(_: unknown, form: FormData) {
  const email = z.email().safeParse(String(form.get("email") || "").trim().toLowerCase());
  if (!email.success) return { ok: false, msg: "Please enter a valid email." };
  const db = await getDb();
  await db.insert(s.subscribers).values({ email: email.data, createdAt: Date.now() }).onConflictDoNothing();
  return { ok: true, msg: "You're on the list ✦ Thanks for joining the inner circle." };
}

const reviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().max(40).optional().default(""),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(5).max(800),
});

export async function submitReview(_: unknown, form: FormData) {
  const r = reviewSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { ok: false, msg: "Please add your name, a rating and a few words." };
  const db = await getDb();
  await db.insert(s.reviews).values({ ...r.data, approved: false, createdAt: Date.now() });
  return { ok: true, msg: "Thank you! Your review will appear once approved." };
}

export async function checkCoupon(code: string, subtotal: number) {
  const bad = { ok: false as const, msg: "This code isn't valid." };
  if (!(await getFeatures()).sale) return bad; // codes are part of the Sale feature
  const db = await getDb();
  const [c] = await db.select().from(s.coupons).where(and(eq(s.coupons.code, code.trim().toUpperCase()), eq(s.coupons.active, true)));
  if (!c) return bad;
  if (c.expires && !inWindow("", c.expires)) return { ok: false as const, msg: "This code has expired." };
  if (subtotal < (c.minTotal ?? 0)) return { ok: false as const, msg: `Valid on orders above ${rs(c.minTotal ?? 0)}.` };
  return { ok: true as const, percent: c.percent, fixed: c.fixed ?? 0, code: c.code };
}

/** "+92 (300) 123-4567", "92300…", "0300-1234567" → "03001234567"; "" if it isn't a Pakistani mobile. */
function normalisePhone(v: string) {
  const m = v.replace(/[\s\-().]/g, "").match(/^(?:(?:\+|00)?92)?0?(3\d{9})$/);
  return m ? `0${m[1]}` : "";
}

const orderSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().max(40, "Enter a valid Pakistani mobile number, e.g. 0300 1234567").transform(normalisePhone).pipe(z.string().min(1, "Enter a valid Pakistani mobile number, e.g. 0300 1234567")),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).default(""),
  city: z.string().trim().min(2, "Please enter your city").max(60),
  address: z.string().trim().min(8, "Please enter your full address").max(300),
  note: z.string().trim().max(300).default(""),
  payment: z.enum(["cod", "bank"]).default("cod"),
  coupon: z.string().trim().max(30).default(""),
  items: z.array(z.object({ productId: z.number().int(), size: z.string().max(30), qty: z.number().int().min(1).max(20, "You can order up to 20 of one item — for bulk orders please WhatsApp us") })).max(30),
  gifts: z.array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(20, "You can order up to 20 of one item — for bulk orders please WhatsApp us") })).max(30).default([]),
  giftWrap: z.boolean().default(false),
  giftMessage: z.string().trim().max(300, "Please keep the gift message under 300 characters").default(""),
});

class OrderError extends Error {}

// One checkout transaction at a time per server instance. A local SQLite file answers a second
// concurrent write transaction with SQLITE_BUSY instead of waiting; queued, they simply run in turn.
let checkoutQueue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(fn: () => Promise<T>) {
  const run = checkoutQueue.then(fn, fn);
  checkoutQueue = run.catch(() => {});
  return run;
}

export type PlaceOrderInput = z.input<typeof orderSchema>;

/** Prices, stock and discounts are all recalculated here — the browser's numbers are never trusted. */
export async function placeOrder(input: PlaceOrderInput) {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    if (errors.items && !errors.items.includes(" ")) errors.items = "Please check the items in your bag.";
    return { ok: false as const, errors };
  }
  const d = parsed.data;
  if (!d.items.length && !d.gifts.length) return { ok: false as const, errors: { items: "Your bag is empty" } };
  const TOO_MANY = "You can order up to 20 of one item — for bulk orders please WhatsApp us";
  // the same perfume + size twice in the bag counts as one line, so the stock check sees the full quantity
  const lines = new Map<string, { productId: number; size: string; qty: number }>();
  for (const it of d.items) {
    const k = `${it.productId}|${it.size}`;
    const line = lines.get(k);
    if (line) line.qty += it.qty;
    else lines.set(k, { ...it });
  }
  const giftLines = new Map<number, number>();
  for (const g of d.gifts) giftLines.set(g.id, (giftLines.get(g.id) ?? 0) + g.qty);
  if ([...lines.values()].some((l) => l.qty > 20) || [...giftLines.values()].some((q) => q > 20)) return { ok: false as const, errors: { items: TOO_MANY } };

  const db = await getDb();
  const st = await getSettings();
  const feat = featuresOf(st);
  // both come back as the storefront shows them: hidden items are missing, sale prices are applied
  const sets = giftLines.size ? await getGiftSets() : [];
  const GONE = "An item in your bag is no longer available. Please remove it and try again.";
  for (const id of giftLines.keys()) if (!sets.some((g) => g.id === id)) return { ok: false as const, errors: { items: GONE } };
  const ids = [...new Set([...d.items.map((i) => i.productId), ...sets.filter((g) => giftLines.has(g.id)).flatMap((g) => g.parts.map((x) => x.productId))])];
  const prods = await getProducts({ ids });

  // every bottle the order takes from stock, whether bought on its own or inside a gift set
  const demand = new Map<string, { productId: number; size: string; qty: number }>();
  const take = (productId: number, size: string, qty: number) => {
    const k = `${productId}|${size}`;
    const n = demand.get(k);
    if (n) n.qty += qty;
    else demand.set(k, { productId, size, qty });
  };

  const items: s.OrderItem[] = [];
  for (const it of lines.values()) {
    const p = prods.find((x) => x.id === it.productId);
    const v = p?.variants.find((x) => x.size === it.size);
    if (!p || !v) return { ok: false as const, errors: { items: GONE } };
    take(p.id, v.size, it.qty);
    items.push({ productId: p.id, name: p.name, slug: p.slug, size: v.size, price: v.price, qty: it.qty, image: p.images[0] ?? null, color: p.color, shape: p.shape });
  }
  for (const [id, qty] of giftLines) {
    const g = sets.find((x) => x.id === id)!;
    for (const part of g.parts) take(part.productId, part.size, qty);
    items.push({ productId: giftLineId(g.id), name: g.name, slug: g.slug, size: GIFT_SIZE, price: g.price, qty, image: g.image, giftSetId: g.id, parts: g.parts.map(({ productId, size, name }) => ({ productId, size, name })) });
  }
  for (const n of demand.values()) {
    const p = prods.find((x) => x.id === n.productId);
    const v = p?.variants.find((x) => x.size === n.size);
    if (!p || !v) return { ok: false as const, errors: { items: GONE } };
    if (v.stock < n.qty) return { ok: false as const, errors: { items: `Only ${v.stock} left of ${p.name} (${v.size}).` } };
  }

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  let discount = 0;
  let coupon = "";
  if (d.coupon) {
    const c = await checkCoupon(d.coupon, subtotal);
    if (!c.ok) return { ok: false as const, errors: { coupon: c.msg } };
    discount = couponDiscount(c, subtotal);
    coupon = c.code;
  }
  const fee = Number(st.shippingFee) || 0;
  const freeOver = Number(st.freeShippingOver) || 0;
  const shipping = freeOver && subtotal - discount >= freeOver ? 0 : fee;
  // gift wrapping and the gift message belong to the Gifts feature
  const giftWrap = feat.gifts && d.giftWrap;
  const giftWrapFee = giftWrap ? Math.max(0, Number(st.giftWrapFee) || 0) : 0;
  const giftMessage = feat.gifts ? d.giftMessage : "";
  const total = subtotal - discount + shipping + giftWrapFee;
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const orderNo = "HF-" + Array.from(randomBytes(7), (b) => ABC[b % ABC.length]).join("");

  // Stock lives in a JSON column, so re-read, check and take it inside one write transaction:
  // two shoppers racing for the last bottle can't both get it.
  try {
    await oneAtATime(() => db.transaction(async (tx) => {
      const fresh = await tx.select({ id: s.products.id, name: s.products.name, variants: s.products.variants }).from(s.products).where(inArray(s.products.id, ids));
      for (const n of demand.values()) {
        const p = fresh.find((x) => x.id === n.productId);
        const v = p?.variants.find((x) => x.size === n.size);
        if (!p || !v) throw new OrderError(GONE);
        if (v.stock < n.qty) throw new OrderError(`Only ${v.stock} left of ${p.name} (${v.size}).`);
        p.variants = p.variants.map((x) => (x.size === n.size ? { ...x, stock: x.stock - n.qty } : x));
      }
      for (const p of fresh) {
        const qty = [...demand.values()].filter((n) => n.productId === p.id).reduce((a, n) => a + n.qty, 0);
        await tx.update(s.products).set({ variants: p.variants, sold: sql`${s.products.sold} + ${qty}` }).where(eq(s.products.id, p.id));
      }
      await tx.insert(s.orders).values({
        orderNo, name: d.name, phone: d.phone, email: d.email, city: d.city, address: d.address, note: d.note,
        items, subtotal, discount, coupon, shipping, giftWrap, giftWrapFee, giftMessage, total, payment: d.payment, status: "pending", createdAt: Date.now(),
      });
      if (coupon) await tx.update(s.coupons).set({ uses: sql`${s.coupons.uses} + 1` }).where(eq(s.coupons.code, coupon));
    }));
  } catch (e) {
    if (e instanceof OrderError) return { ok: false as const, errors: { items: e.message } };
    throw e;
  }
  return { ok: true as const, orderNo };
}
