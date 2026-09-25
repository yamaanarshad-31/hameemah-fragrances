/**
 * Bottle photos restyled for the site theme, September 2026. Safe to run more than once.
 *
 * public/photos/*.webp were re-made as studio shots on the brand's emerald and gold set.
 * scripts/catalog-update-2026-09.ts had stored the previous crops in the `images` table
 * (id = md5 of the file), so products still point at those rows. This script:
 *
 *   - stores the new photos in `images` the same way (id = md5 of the new file);
 *   - swaps the old crop ids for the new ones in `products.images`, and in the image of
 *     order line items so order history keeps its picture;
 *   - deletes the old crop rows.
 *
 * Only the three old crop ids listed below are touched. Photos the owner uploaded in Admin
 * have other ids and are never changed.
 *
 * Local:       npx tsx scripts/photos-theme-2026-09.ts
 * Production:  DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npx tsx scripts/photos-theme-2026-09.ts
 * Add --dry-run to print what would change without writing anything.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Client, InStatement } from "@libsql/client";

const DRY = process.argv.includes("--dry-run");

// md5 ids of the crops that catalog-update-2026-09 inserted (commit 528fdae).
const OLD: Record<string, string> = {
  fc06ebbdf35b08a61d013f2b6a215c45: "bottle-clear.webp",
  "87b64f982fa3db9559cc85c0e85888f4": "bottle-blue.webp",
  e7609462f2c1cbe7a5f6bd21910c3d91: "bottles-group.webp",
};

// Same connection rules as lib/db/index.ts.
async function connect(): Promise<Client> {
  const url = process.env.DATABASE_URL;
  if (url && !url.startsWith("file:")) {
    const { createClient } = await import("@libsql/client/web");
    return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  const { createClient } = await import("@libsql/client");
  return createClient({ url: url || "file:data/store.db" });
}

const parse = <T>(v: unknown, fallback: T): T => {
  try { return JSON.parse(String(v)) as T; } catch { return fallback; }
};

async function main() {
  const db = await connect();
  const where = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:") ? process.env.DATABASE_URL : "local data/store.db";
  console.log(`Theme photos → ${where}${DRY ? " (dry run)" : ""}`);

  const hasTables = await db.execute("select count(*) as n from sqlite_master where type = 'table' and name in ('products', 'images', 'orders')");
  if (Number(hasTables.rows[0].n) < 3) {
    console.log("This database has not been set up yet — the site seeds it with the /photos files on its first visit. Nothing to do.");
    return;
  }

  // old id → new id, where the new id is the md5 of the file now in public/photos
  const swap = new Map<string, string>();
  const writes: InStatement[] = [];
  for (const [oldId, file] of Object.entries(OLD)) {
    const data = readFileSync(path.join(process.cwd(), "public/photos", file));
    const newId = createHash("md5").update(data).digest("hex");
    if (newId === oldId) throw new Error(`public/photos/${file} is still the old photo — nothing to swap.`);
    swap.set(oldId, newId);
    writes.push({ sql: "insert or ignore into images (id, mime, data, created_at) values (?, ?, ?, ?)", args: [newId, "image/webp", data, Date.now()] });
  }
  const url = (id: string) => `/api/img/${id}`;
  const swapUrl = (u: string) => {
    const id = u.startsWith("/api/img/") ? u.slice(9) : null;
    return id && swap.has(id) ? url(swap.get(id)!) : u;
  };

  let changed = 0;
  for (const p of (await db.execute("select id, name, images from products")).rows) {
    const images = parse<string[]>(p.images, []);
    const next = images.map(swapUrl);
    if (JSON.stringify(next) === JSON.stringify(images)) continue;
    writes.push({ sql: "update products set images = ? where id = ?", args: [JSON.stringify(next), Number(p.id)] });
    console.log(`- ${p.name}: ${images.filter((u, i) => u !== next[i]).length} photo(s) swapped`);
    changed++;
  }

  let orders = 0;
  for (const o of (await db.execute("select id, items from orders")).rows) {
    const items = parse<{ image?: string | null }[]>(o.items, []);
    let hit = false;
    for (const it of items) {
      if (!it.image) continue;
      const next = swapUrl(it.image);
      if (next !== it.image) { it.image = next; hit = true; }
    }
    if (!hit) continue;
    writes.push({ sql: "update orders set items = ? where id = ?", args: [JSON.stringify(items), Number(o.id)] });
    orders++;
  }
  if (orders) console.log(`- ${orders} order(s): line-item photo swapped`);

  const oldIds = Object.keys(OLD);
  const present = await db.execute({ sql: `select count(*) as n from images where id in (${oldIds.map(() => "?").join(",")})`, args: oldIds });
  const stale = Number(present.rows[0].n);
  writes.push({ sql: `delete from images where id in (${oldIds.map(() => "?").join(",")})`, args: oldIds });
  if (stale) console.log(`- deleting ${stale} old photo row(s)`);

  if (!changed && !orders && !stale) console.log("Already up to date.");
  if (DRY) { console.log(`Dry run: ${writes.length} statements not written.`); return; }
  await db.batch(writes, "write");

  const n = await db.execute("select (select count(*) from images) as images");
  console.log(`Done. ${n.rows[0].images} stored images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
