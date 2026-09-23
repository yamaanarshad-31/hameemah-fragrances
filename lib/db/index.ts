import "server-only";
import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { seed } from "./seed";

// Local: a SQLite file. Production: set DATABASE_URL=libsql://… + DATABASE_AUTH_TOKEN (Turso).
if (!process.env.DATABASE_URL) mkdirSync("data", { recursive: true });

const client = createClient({
  url: process.env.DATABASE_URL || "file:data/store.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const raw = drizzle(client, { schema });

const DDL = [
  `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, blurb TEXT DEFAULT '', color TEXT DEFAULT '#0f3d2a', sort INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, tagline TEXT DEFAULT '', description TEXT DEFAULT '', category_id INTEGER, concentration TEXT DEFAULT 'Eau de Parfum', top_notes TEXT DEFAULT '', heart_notes TEXT DEFAULT '', base_notes TEXT DEFAULT '', longevity INTEGER DEFAULT 4, sillage INTEGER DEFAULT 3, variants TEXT NOT NULL, images TEXT NOT NULL, color TEXT DEFAULT '#b8860b', shape INTEGER DEFAULT 0, featured INTEGER DEFAULT 0, bestseller INTEGER DEFAULT 0, is_new INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sold INTEGER DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', city TEXT NOT NULL, address TEXT NOT NULL, note TEXT DEFAULT '', items TEXT NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER DEFAULT 0, coupon TEXT DEFAULT '', shipping INTEGER DEFAULT 0, total INTEGER NOT NULL, payment TEXT DEFAULT 'cod', status TEXT DEFAULT 'pending', created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, name TEXT NOT NULL, city TEXT DEFAULT '', rating INTEGER NOT NULL, body TEXT NOT NULL, approved INTEGER DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, percent INTEGER NOT NULL, min_total INTEGER DEFAULT 0, active INTEGER DEFAULT 1, uses INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`,
];

let ready: Promise<void> | null = null;

/** Creates tables on first use and fills an empty store with starter products. */
export function getDb() {
  if (!ready) {
    ready = (async () => {
      await client.batch(DDL, "write");
      await seed(raw);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready.then(() => raw);
}

export type DB = typeof raw;
export { schema };
