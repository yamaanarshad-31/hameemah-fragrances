/**
 * Every product gets the house bottle, September 2026. Safe to run more than once.
 *
 * public/photos now holds one bottle: bottle-signature.webp (studio shot) and
 * bottle-detail.webp (close-up of the monogram). This replaces the earlier bottle photos,
 * whichever of them a database still has:
 *
 *   - the crops from catalog-update-2026-09 (stored in `images`, id = md5 of the file);
 *   - the theme restyle from photos-theme-2026-09 (same, newer md5 ids);
 *   - the plain /photos/... paths a fresh seed wrote before this change.
 *
 * The bottle shot replaces the single-bottle photos and the close-up replaces the group shot,
 * in `products.images` and in order line items. The old photo rows are then deleted.
 * Photos the owner uploaded in Admin have other ids and are never changed.
 *
 * Local:       npx tsx scripts/photos-signature-2026-09.ts
 * Production:  DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npx tsx scripts/photos-signature-2026-09.ts
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
  // catalog-update-2026-09 (commit 528fdae)
  fc06ebbdf35b08a61d013f2b6a215c45: "signature", // bottle-clear
  "87b64f982fa3db9559cc85c0e85888f4": "signature", // bottle-blue
  e7609462f2c1cbe7a5f6bd21910c3d91: "detail", // bottles-group
  // photos-theme-2026-09 (commit 95d5314)
  "9782b96678841aff8a94d5389a9eea0b": "signature",
  ecf9b0d6b14f23376af8b948533e93a5: "signature",
  fb697d7070a11f47fd0895331420948f: "detail",
};
const OLD_PATHS: Record<string, Kind> = {
  "/photos/bottle-clear.webp": "signature",
  "/photos/bottle-blue.webp": "signature",
  "/photos/bottles-group.webp": "detail",
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
  console.log(`House bottle photos → ${where}${DRY ? " (dry run)" : ""}`);

  const hasTables = await db.execute("select count(*) as n from sqlite_master where type = 'table' and name in ('products', 'images', 'orders')");
  if (Number(hasTables.rows[0].n) < 3) {
    console.log("This database has not been set up yet — the site seeds it with the /photos files on its first visit. Nothing to do.");
    return;
  }

  const writes: InStatement[] = [];
  const next: Record<Kind, string> = { signature: "", detail: "" };
  for (const kind of Object.keys(FILES) as Kind[]) {
    const data = readFileSync(path.join(process.cwd(), "public/photos", FILES[kind]));
    const id = createHash("md5").update(data).digest("hex");
    next[kind] = `/api/img/${id}`;
    writes.push({ sql: "insert or ignore into images (id, mime, data, created_at) values (?, ?, ?, ?)", args: [id, "image/webp", data, Date.now()] });
  }
  const swapUrl = (u: string) => {
    const id = u.startsWith("/api/img/") ? u.slice(9) : null;
    const kind = (id && OLD_IDS[id]) || OLD_PATHS[u];
    return kind ? next[kind] : u;
  };
  // two old single-bottle photos can both become the bottle shot; keep it once
  const dedupe = (list: string[]) => list.filter((u, i) => list.indexOf(u) === i);

  let changed = 0;
  for (const p of (await db.execute("select id, name, images from products")).rows) {
    const images = parse<string[]>(p.images, []);
    const updated = dedupe(images.map(swapUrl));
    if (JSON.stringify(updated) === JSON.stringify(images)) continue;
    writes.push({ sql: "update products set images = ? where id = ?", args: [JSON.stringify(updated), Number(p.id)] });
    console.log(`- ${p.name}: photos → house bottle`);
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

  const oldIds = Object.keys(OLD_IDS);
  const inList = `(${oldIds.map(() => "?").join(",")})`;
  const present = await db.execute({ sql: `select count(*) as n from images where id in ${inList}`, args: oldIds });
  const stale = Number(present.rows[0].n);
  writes.push({ sql: `delete from images where id in ${inList}`, args: oldIds });
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
