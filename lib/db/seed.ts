import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as s from "./schema";

export const DEFAULT_SETTINGS: Record<string, string> = {
  announcement: "Free delivery on orders above Rs. 5,000 | Cash on Delivery all over Pakistan | Use code WELCOME10 for 10% off",
  whatsapp: "923001234567",
  phone: "0300 1234567",
  email: "info@fragrancesbyhameemah.com",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/",
  shippingFee: "250",
  freeShippingOver: "5000",
  heroTitle: "Wear a scent they'll remember",
  heroSubtitle: "Long-lasting luxury perfumes, crafted in small batches and delivered to your door across Pakistan.",
  city: "Pakistan",
  bankDetails: "Bank: (add your bank name)\nAccount title: Fragrances by Hameemah\nAccount / IBAN: (add in Admin → Settings)\nJazzCash / Easypaisa: 0300 1234567",
};

// Every perfume comes in 50ml and 100ml.
const v = (b: number, c: number, sale = 0): s.Variant[] => [
  { size: "50ml", price: b, compareAt: sale ? Math.round(b * 1.25 / 10) * 10 : null, stock: 35 },
  { size: "100ml", price: c, compareAt: sale ? Math.round(c * 1.25 / 10) * 10 : null, stock: 20 },
];

type SeedProduct = Omit<typeof s.products.$inferInsert, "createdAt" | "images" | "categoryId"> & { cat: string };

// Real photos of the shop's bottles (public/photos). The blue bottle goes with the fresh,
// blue scents; the clear one with the rest. The group shot is every product's second photo.
const PHOTO = { clear: "/photos/bottle-clear.webp", blue: "/photos/bottle-blue.webp", group: "/photos/bottles-group.webp" };
export const BLUE_BOTTLE = new Set(["ocean-crown", "citrus-couture", "emerald-noir"]);
export const photosFor = (slug: string) => [BLUE_BOTTLE.has(slug) ? PHOTO.blue : PHOTO.clear, PHOTO.group];

const PRODUCTS: SeedProduct[] = [
  { name: "Emerald Noir", slug: "emerald-noir", cat: "men", tagline: "Fresh green vetiver, dark and magnetic",
    description: "A crisp opening of bergamot and green apple gives way to vetiver and cedar. Confident, clean and made for evenings out.",
    topNotes: "Bergamot, Green Apple", heartNotes: "Vetiver, Lavender", baseNotes: "Cedarwood, Tonka", longevity: 4, sillage: 4,
    variants: v(3590, 5490), color: "#0f5132", shape: 1, featured: true, bestseller: true, sold: 142 },
  { name: "Rose Sultana", slug: "rose-sultana", cat: "women", tagline: "A velvet bouquet of Damask rose",
    description: "Lush Damask rose and lychee wrapped in soft vanilla and white musk. Romantic, graceful and quietly unforgettable.",
    topNotes: "Lychee, Mandarin", heartNotes: "Damask Rose, Peony", baseNotes: "Vanilla, White Musk", longevity: 4, sillage: 3,
    variants: v(3590, 5490, 1), color: "#b0415b", shape: 2, featured: true, bestseller: true, sold: 163, isNew: true },
  { name: "Amber Majesty", slug: "amber-majesty", cat: "unisex", tagline: "Golden amber and honeyed spice",
    description: "Warm and glowing — cinnamon and honey melt into labdanum amber and sandalwood. A cosy, regal scent for cooler nights.",
    topNotes: "Cinnamon, Orange Zest", heartNotes: "Honey, Labdanum", baseNotes: "Amber, Sandalwood", longevity: 5, sillage: 4,
    variants: v(3890, 5990), color: "#c47a12", shape: 3, bestseller: true, sold: 121 },
  { name: "Velvet Musk", slug: "velvet-musk", cat: "women", tagline: "Clean skin-musk you can't stop smelling",
    description: "Soft, powdery and intimate. Iris and cotton flower rest on a bed of creamy white musks — your skin, but better.",
    topNotes: "Pear, Aldehydes", heartNotes: "Iris, Cotton Flower", baseNotes: "White Musk, Cashmeran", longevity: 4, sillage: 2,
    variants: v(3290, 4990), color: "#e8c7c1", shape: 1, isNew: true, sold: 77 },
  { name: "Saffron Royale", slug: "saffron-royale", cat: "unisex", tagline: "Saffron, leather and smooth sandalwood",
    description: "Opulent and addictive. Saffron threads meet supple leather and jasmine, finishing on a smooth base of sandalwood and ambergris.",
    topNotes: "Saffron, Cardamom", heartNotes: "Jasmine, Leather", baseNotes: "Sandalwood, Ambergris", longevity: 5, sillage: 5,
    variants: v(4290, 6990, 1), color: "#8a1f11", shape: 0, featured: true, bestseller: true, sold: 139 },
  { name: "Citrus Couture", slug: "citrus-couture", cat: "men", tagline: "Sparkling citrus for hot summer days",
    description: "An energising splash of Sicilian lemon, grapefruit and sea salt over light woods. Your everyday fresh favourite.",
    topNotes: "Lemon, Grapefruit", heartNotes: "Sea Salt, Neroli", baseNotes: "Driftwood, Musk", longevity: 3, sillage: 3,
    variants: v(2890, 4490), color: "#d9b43a", shape: 2, isNew: true, sold: 64 },
  { name: "Midnight Jasmine", slug: "midnight-jasmine", cat: "women", tagline: "Night-blooming jasmine and tuberose",
    description: "Heady white florals that come alive after dark — jasmine sambac and tuberose over a smooth benzoin glow.",
    topNotes: "Blackcurrant, Bergamot", heartNotes: "Jasmine Sambac, Tuberose", baseNotes: "Benzoin, Vanilla", longevity: 4, sillage: 4,
    variants: v(3590, 5490), color: "#3b2a5c", shape: 3, featured: true, sold: 98 },
  { name: "Ocean Crown", slug: "ocean-crown", cat: "men", tagline: "Aquatic, airy and effortlessly cool",
    description: "Marine accords and mint over ambroxan — the scent of an open sea breeze. Clean, modern and office-friendly.",
    topNotes: "Mint, Marine Accord", heartNotes: "Geranium, Sage", baseNotes: "Ambroxan, Cedar", longevity: 4, sillage: 3,
    variants: v(3290, 4990), color: "#1d5f8a", shape: 1, bestseller: true, sold: 117 },
  { name: "Leather & Smoke", slug: "leather-and-smoke", cat: "men", tagline: "Bold smoky leather with birch tar",
    description: "For those who like to be noticed. Smoky birch, black pepper and rich leather over a dry, woody base.",
    topNotes: "Black Pepper, Juniper", heartNotes: "Leather, Birch Tar", baseNotes: "Vetiver, Oakmoss", longevity: 5, sillage: 4,
    variants: v(3890, 5990), color: "#2b1d14", shape: 0, isNew: true, sold: 58 },
];

const CATS = [
  { name: "For Him", slug: "men", blurb: "Bold, fresh & woody", color: "#0f3d2a", sort: 1 },
  { name: "For Her", slug: "women", blurb: "Floral, soft & radiant", color: "#6b2138", sort: 2 },
  { name: "Unisex", slug: "unisex", blurb: "Made to be shared", color: "#6b4a12", sort: 3 },
];

const REVIEWS = [
  ["emerald-noir", "Hamza S.", "Islamabad", 5, "My new daily. Fresh in the morning and still there at night."],
  ["emerald-noir", "Usman T.", "Multan", 4, "Very classy scent. Wish the 100ml was a bit cheaper, but quality is top."],
  ["rose-sultana", "Mahnoor A.", "Karachi", 5, "The softest, most beautiful rose. Delivered in 2 days with a sweet note inside."],
  ["saffron-royale", "Zain M.", "Faisalabad", 5, "Beast mode projection. Got compliments at the office on day one."],
  ["amber-majesty", "Sana H.", "Rawalpindi", 5, "Warm and cosy, perfect for winter evenings."],
  ["ocean-crown", "Ali N.", "Peshawar", 4, "Clean and fresh, great for summer."],
] as const;

/** True for the demo reviews above, so they are never presented to search engines as real ratings. */
export const isSampleReview = (r: { name: string; body: string }) => REVIEWS.some(([, name, , , body]) => name === r.name && body === r.body);

export async function seed(db: LibSQLDatabase<typeof s>) {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(s.categories);
  if (existing[0].n > 0) return;

  const now = Date.now();
  await db.insert(s.categories).values(CATS).onConflictDoNothing();
  const cats = await db.select().from(s.categories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? null;

  await db.insert(s.products).values(
    PRODUCTS.map(({ cat, ...p }, i) => ({ ...p, categoryId: catId(cat), images: photosFor(p.slug), createdAt: now - i * 86400000 })),
  ).onConflictDoNothing();
  const prods = await db.select({ id: s.products.id, slug: s.products.slug }).from(s.products);
  const pid = (slug: string) => prods.find((p) => p.slug === slug)!.id;

  await db.insert(s.reviews).values(
    REVIEWS.map(([slug, name, city, rating, body], i) => ({ productId: pid(slug), name, city, rating, body, approved: true, createdAt: now - i * 3600000 * 20 })),
  );
  await db.insert(s.settings).values(Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }))).onConflictDoNothing();
  await db.insert(s.coupons).values([{ code: "WELCOME10", percent: 10, minTotal: 0 }]).onConflictDoNothing();

  // A few clearly-labelled demo orders so the dashboard isn't empty on day one.
  // Admin → Settings → "Remove demo orders" deletes them.
  const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan", "Faisalabad"];
  const statuses = ["delivered", "delivered", "shipped", "confirmed", "pending", "delivered"];
  const demo = Array.from({ length: 18 }, (_, i) => {
    const p = PRODUCTS[(i * 5) % PRODUCTS.length];
    const variant = p.variants[i % p.variants.length];
    const qty = 1 + (i % 2);
    const subtotal = variant.price * qty;
    const shipping = subtotal >= 5000 ? 0 : 250;
    return {
      orderNo: `DEMO-${1001 + i}`,
      name: `Demo Customer ${i + 1}`,
      phone: "03000000000",
      city: cities[i % cities.length],
      address: "Demo address",
      items: [{ productId: pid(p.slug), name: p.name, slug: p.slug, size: variant.size, price: variant.price, qty, color: p.color, shape: p.shape }],
      subtotal,
      shipping,
      total: subtotal + shipping,
      status: statuses[i % statuses.length],
      createdAt: now - Math.floor(i * 0.8) * 86400000 - i * 3600000,
    };
  });
  await db.insert(s.orders).values(demo).onConflictDoNothing();
}
