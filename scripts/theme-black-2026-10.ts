/**
 * Black and gold theme, October 2026. Safe to run more than once.
 *
 * The site moved from emerald green to black to match the logo. The two house bottle photos in
 * public/photos were regraded to a black backdrop, and a database that stores them in `images`
 * (id = md5 of the file) still holds the green versions. This swaps them, in `products.images`
 * and in order line items, and deletes the green rows. A fresh seed uses the /photos/... paths,
 * which already serve the new files, so it has nothing to swap.
 *
 * It also moves any category still on the old default green to the new default black.
 * Photos the owner uploaded in Admin, and colours they picked, are never changed.
 *
 * Local:       npx tsx scripts/theme-black-2026-10.ts
 * Production:  DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npx tsx scripts/theme-black-2026-10.ts
 * Add --dry-run to print what would change without writing anything.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Client, InStatement } from "@libsql/client";

const DRY = process.argv.includes("--dry-run");

type Kind = "signature" | "detail";
const FILES: Record<Kind, string> = { signature: "bottle-signature.webp", detail: "bottle-detail.webp" };

// Old photo → which new photo takes its place.
const OLD_IDS: Record<string, Kind> = {
  // photos-signature-2026-09 (commit 508bb6a), emerald backdrop
  "6b7186461306021a0878599ab081d563": "signature",
  "6ea4f5cd7d35b9e55f8c2fa64b3a82d1": "detail",
};
const OLD_GREEN = "#0f3d2a";
const NEW_BLACK = "#1c1b19";

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
  console.log(`Black and gold theme → ${where}${DRY ? " (dry run)" : ""}`);

  const hasTables = await db.execute("select count(*) as n from sqlite_master where type = 'table' and name in ('products', 'images', 'orders')");
  if (Number(hasTables.rows[0].n) < 3) {
    console.log("This database has not been set up yet — the site seeds it with the /photos files on its first visit. Nothing to do.");
    return;
  }

  const writes: InStatement[] = [];
  const photos: InStatement[] = [];
  const next: Record<Kind, string> = { signature: "", detail: "" };
  for (const kind of Object.keys(FILES) as Kind[]) {
    const data = readFileSync(path.join(process.cwd(), "public/photos", FILES[kind]));
    const id = createHash("md5").update(data).digest("hex");
    next[kind] = `/api/img/${id}`;
    photos.push({ sql: "insert or ignore into images (id, mime, data, created_at) values (?, ?, ?, ?)", args: [id, "image/webp", data, Date.now()] });
  }
  const swapUrl = (u: string) => {
    const id = u.startsWith("/api/img/") ? u.slice(9) : null;
    const kind = id ? OLD_IDS[id] : undefined;
    return kind ? next[kind] : u;
  };

  let changed = 0;
  for (const p of (await db.execute("select id, name, images from products")).rows) {
    const images = parse<string[]>(p.images, []);
    const updated = images.map(swapUrl);
    if (JSON.stringify(updated) === JSON.stringify(images)) continue;
    writes.push({ sql: "update products set images = ? where id = ?", args: [JSON.stringify(updated), Number(p.id)] });
    console.log(`- ${p.name}: photos → black backdrop`);
    changed++;
  }

  let orders = 0;
  for (const o of (await db.execute("select id, items from orders")).rows) {
    const items = parse<{ image?: string | null }[]>(o.items, []);
    let hit = false;
    for (const it of items) {
      if (!it.image) continue;
      const u = swapUrl(it.image);
      if (u !== it.image) { it.image = u; hit = true; }
    }
    if (!hit) continue;
    writes.push({ sql: "update orders set items = ? where id = ?", args: [JSON.stringify(items), Number(o.id)] });
    orders++;
  }
  if (orders) console.log(`- ${orders} order(s): line-item photo swapped`);

  // store the new photos only where something points at the old ones
  if (changed || orders) writes.unshift(...photos);

  const green = await db.execute({ sql: "select name from categories where lower(color) = ?", args: [OLD_GREEN] });
  for (const c of green.rows) console.log(`- ${c.name}: colour → black`);
  writes.push({ sql: "update categories set color = ? where lower(color) = ?", args: [NEW_BLACK, OLD_GREEN] });

  const oldIds = Object.keys(OLD_IDS);
  const inList = `(${oldIds.map(() => "?").join(",")})`;
  const present = await db.execute({ sql: `select count(*) as n from images where id in ${inList}`, args: oldIds });
  const stale = Number(present.rows[0].n);
  writes.push({ sql: `delete from images where id in ${inList}`, args: oldIds });
  if (stale) console.log(`- deleting ${stale} old photo row(s)`);

  if (!changed && !orders && !stale && !green.rows.length) console.log("Already up to date.");
  if (DRY) { console.log(`Dry run: ${writes.length} statements not written.`); return; }
  await db.batch(writes, "write");

  const n = await db.execute("select (select count(*) from images) as images");
  console.log(`Done. ${n.rows[0].images} stored images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
