import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

/**
 * `price` is the regular price. `salePrice` is the owner's sale price for this size (kept while the sale is off).
 * `compareAt` is only set on variants handed to the storefront: the crossed-out regular price of a discounted size.
 */
export type Variant = { size: string; price: number; compareAt?: number | null; salePrice?: number | null; stock: number };
/** One perfume inside a gift set. */
export type GiftPart = { productId: number; size: string };
export type OrderItem = {
  productId: number;
  name: string;
  slug: string;
  size: string;
  price: number;
  qty: number;
  image?: string | null;
  color?: string | null;
  shape?: number | null;
  /** Set on gift-set lines: the set's id and the bottles whose stock it took. */
  giftSetId?: number;
  parts?: { productId: number; size: string; name: string }[];
};

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  blurb: text("blurb").default(""),
  color: text("color").default("#1c1b19"),
  sort: integer("sort").default(0),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").default(""),
  description: text("description").default(""),
  categoryId: integer("category_id"),
  concentration: text("concentration").default("Eau de Parfum"),
  topNotes: text("top_notes").default(""),
  heartNotes: text("heart_notes").default(""),
  baseNotes: text("base_notes").default(""),
  longevity: integer("longevity").default(4), // 1-5
  sillage: integer("sillage").default(3), // 1-5
  variants: text("variants", { mode: "json" }).$type<Variant[]>().notNull(),
  images: text("images", { mode: "json" }).$type<string[]>().notNull(),
  color: text("color").default("#b8860b"), // liquid colour for the drawn bottle
  shape: integer("shape").default(0),
  featured: integer("featured", { mode: "boolean" }).default(false),
  bestseller: integer("bestseller", { mode: "boolean" }).default(false),
  isNew: integer("is_new", { mode: "boolean" }).default(false),
  active: integer("active", { mode: "boolean" }).default(true),
  sold: integer("sold").default(0),
  // sale: either a % off every size, or a `salePrice` on individual variants; days are "YYYY-MM-DD" (Pakistan time), "" = no limit
  salePercent: integer("sale_percent").default(0),
  saleStart: text("sale_start").default(""),
  saleEnd: text("sale_end").default(""),
  createdAt: integer("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNo: text("order_no").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").default(""),
  city: text("city").notNull(),
  address: text("address").notNull(),
  note: text("note").default(""),
  items: text("items", { mode: "json" }).$type<OrderItem[]>().notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0),
  coupon: text("coupon").default(""),
  shipping: integer("shipping").default(0),
  total: integer("total").notNull(),
  giftWrap: integer("gift_wrap", { mode: "boolean" }).default(false),
  giftWrapFee: integer("gift_wrap_fee").default(0), // rupees charged for the wrapping (can be 0 = free)
  giftMessage: text("gift_message").default(""),
  payment: text("payment").default("cod"),
  status: text("status").default("pending"),
  createdAt: integer("created_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  city: text("city").default(""),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  approved: integer("approved", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").notNull(),
});

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  percent: integer("percent").notNull(), // 0 for a fixed-amount code
  fixed: integer("fixed").default(0), // rupees off; when above 0 the code is a fixed-amount one
  minTotal: integer("min_total").default(0),
  expires: text("expires").default(""), // last valid day "YYYY-MM-DD" (Pakistan time), "" = never
  active: integer("active", { mode: "boolean" }).default(true),
  uses: integer("uses").default(0),
});

export const giftSets = sqliteTable("gift_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  image: text("image").default(""),
  items: text("items", { mode: "json" }).$type<GiftPart[]>().notNull(),
  price: integer("price").notNull(),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at").notNull(),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Uploaded product photos live in the database so the site works on any host
// (Vercel has no writable disk) without a separate storage service.
export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  createdAt: integer("created_at").notNull(),
});

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type GiftSet = typeof giftSets.$inferSelect;
