"use server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { getSettings } from "@/lib/data";

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
  const db = await getDb();
  const [c] = await db.select().from(s.coupons).where(and(eq(s.coupons.code, code.trim().toUpperCase()), eq(s.coupons.active, true)));
  if (!c) return { ok: false as const, msg: "This code isn't valid." };
  if (subtotal < (c.minTotal ?? 0)) return { ok: false as const, msg: `Valid on orders above Rs. ${c.minTotal}.` };
  return { ok: true as const, percent: c.percent, code: c.code };
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
  items: z.array(z.object({ productId: z.number().int(), size: z.string().max(30), qty: z.number().int().min(1).max(20, "You can order up to 20 of one item — for bulk orders please WhatsApp us") })).min(1, "Your bag is empty").max(30),
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
  // the same perfume + size twice in the bag counts as one line, so the stock check sees the full quantity
  const lines = new Map<string, { productId: number; size: string; qty: number }>();
  for (const it of d.items) {
    const k = `${it.productId}|${it.size}`;
    const line = lines.get(k);
    if (line) line.qty += it.qty;
    else lines.set(k, { ...it });
  }
  if ([...lines.values()].some((l) => l.qty > 20)) return { ok: false as const, errors: { items: "You can order up to 20 of one item — for bulk orders please WhatsApp us" } };

  const db = await getDb();
  const ids = [...new Set(d.items.map((i) => i.productId))];
  const prods = await db.select().from(s.products).where(and(inArray(s.products.id, ids), eq(s.products.active, true)));

  const items: s.OrderItem[] = [];
  for (const it of lines.values()) {
    const p = prods.find((x) => x.id === it.productId);
    const v = p?.variants.find((x) => x.size === it.size);
    if (!p || !v) return { ok: false as const, errors: { items: "An item in your bag is no longer available. Please remove it and try again." } };
    if (v.stock < it.qty) return { ok: false as const, errors: { items: `Only ${v.stock} left of ${p.name} (${v.size}).` } };
    items.push({ productId: p.id, name: p.name, slug: p.slug, size: v.size, price: v.price, qty: it.qty, image: p.images[0] ?? null, color: p.color, shape: p.shape });
  }

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  let discount = 0;
  let coupon = "";
  if (d.coupon) {
    const c = await checkCoupon(d.coupon, subtotal);
    if (!c.ok) return { ok: false as const, errors: { coupon: c.msg } };
    discount = Math.round((subtotal * c.percent) / 100);
    coupon = c.code;
  }
  const st = await getSettings();
  const fee = Number(st.shippingFee) || 0;
  const freeOver = Number(st.freeShippingOver) || 0;
  const shipping = freeOver && subtotal - discount >= freeOver ? 0 : fee;
  const total = subtotal - discount + shipping;
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const orderNo = "HF-" + Array.from(randomBytes(7), (b) => ABC[b % ABC.length]).join("");

  // Stock lives in a JSON column, so re-read, check and take it inside one write transaction:
  // two shoppers racing for the last bottle can't both get it.
  try {
    await oneAtATime(() => db.transaction(async (tx) => {
      const fresh = await tx.select({ id: s.products.id, name: s.products.name, variants: s.products.variants }).from(s.products).where(inArray(s.products.id, ids));
      for (const it of items) {
        const p = fresh.find((x) => x.id === it.productId);
        const v = p?.variants.find((x) => x.size === it.size);
        if (!p || !v) throw new OrderError("An item in your bag is no longer available. Please remove it and try again.");
        if (v.stock < it.qty) throw new OrderError(`Only ${v.stock} left of ${p.name} (${v.size}).`);
        p.variants = p.variants.map((x) => (x.size === it.size ? { ...x, stock: x.stock - it.qty } : x));
      }
      for (const p of fresh) {
        const qty = items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.qty, 0);
        await tx.update(s.products).set({ variants: p.variants, sold: sql`${s.products.sold} + ${qty}` }).where(eq(s.products.id, p.id));
      }
      await tx.insert(s.orders).values({
        orderNo, name: d.name, phone: d.phone, email: d.email, city: d.city, address: d.address, note: d.note,
        items, subtotal, discount, coupon, shipping, total, payment: d.payment, status: "pending", createdAt: Date.now(),
      });
      if (coupon) await tx.update(s.coupons).set({ uses: sql`${s.coupons.uses} + 1` }).where(eq(s.coupons.code, coupon));
    }));
  } catch (e) {
    if (e instanceof OrderError) return { ok: false as const, errors: { items: e.message } };
    throw e;
  }
  return { ok: true as const, orderNo };
}
