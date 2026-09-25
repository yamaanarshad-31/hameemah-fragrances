/**
 * Catalogue update, September 2026. Safe to run more than once.
 *
 *   - Removes the "Oud & Attar" and "Gift Sets" collections, their products, those
 *     products' reviews and their photos.
 *   - Every perfume is now sold in 50ml and 100ml only: 30ml sizes are removed.
 *   - Oud notes in the remaining perfumes become sandalwood (or amberwood / vetiver).
 *   - Puts the real photos of the shop's bottles (public/photos) in the `images` table,
 *     the same way Admin → upload does, and uses them as the product photos. Photos the
 *     owner uploaded in Admin are kept; only the old computer-generated renders are replaced.
 *   - Deletes the old generated renders once nothing uses them (order history is left alone,
 *     so any image an order still points at is kept).
 *   - Resets settings that mention gifts, oud or attar to the default wording.
 *
 * Local:       npx tsx scripts/catalog-update-2026-09.ts
 * Production:  DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npx tsx scripts/catalog-update-2026-09.ts
 * Add --dry-run to print what would change without writing anything.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Client, InStatement } from "@libsql/client";
import { BLUE_BOTTLE, DEFAULT_SETTINGS } from "../lib/db/seed";

const DRY = process.argv.includes("--dry-run");
const GONE_CATEGORIES = ["oud-attar", "gift-sets"];
const GONE_PRODUCTS = ["oud-al-hameem", "white-oudh-attar", "signature-gift-box"];
const BANNED = /\b(gifts?|gifting|oudh?s?|attars?|ittars?|agarwood)\b/i;

// The studio renders made by scripts/product-photos.tsx on 23 Sep 2026 (the production DB
// was copied from this local DB). Any other 1200×1200 WebP a product uses is treated as a
// render too, since that is exactly what the script produced.
const GENERATED = new Set([
  "0869494fae594ae3a28c994b88dcf313", "086b921be3744699b5d466e7f40e0478", "0c1caa2978554f718ef49d6335035c5c", "13e0e21f6a8a4c9a87fb9ceda4b79990",
  "142e317efe5342bc9ca491c7fb8e56a1", "28f271dd0f834788a5067ab1413df018", "32f9e588d8a64cc29bdc1c8ced5a3851", "38ce6df854e44f079a869967482ce7c6",
  "51ec90c203924e649ce520dc2becd06a", "5405a7c2a56646f698f1175d985d73d1", "58d3175b3e154351972f75de21c7594f", "65f88ef4ba5a40978001b72f75cd95b7",
  "69610f28f47e413a9e72ee7e71536fb4", "762ffff8f5dc43bfa77ee1e820a65757", "87e77468de9f4b35b3eae25305edebe9", "8d964cb7327845388f81fe087078f63c",
  "9f79dd59433f4fcebe27619109d5fc77", "a37e5a3871cd441fa6146a450b93c687", "b6bfa845743a423ea12da46383d0756b", "c3553e42bd5a40e491adaee7ea77bf7c",
  "c448390d20374b089da5bdba2e1f0d13", "db1b9226e52a4d7a80625d5d4a81f1df", "dc6e9cda48b74ce98b3127ff0cf41755", "e142df8e307a4519a5792ccd4d02436d",
]);

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

const imgId = (u: string) => (u.startsWith("/api/img/") ? u.slice(9) : null);
const parse = <T>(v: unknown, fallback: T): T => {
  try { return JSON.parse(String(v)) as T; } catch { return fallback; }
};

/** Swaps oud-type notes for a woody note the perfume doesn't already list. */
function fixNotes(list: string) {
  const notes = list.split(",").map((n) => n.trim()).filter(Boolean);
  const out: string[] = [];
  for (const n of notes) {
    if (!BANNED.test(n)) { out.push(n); continue; }
    const swap = ["Sandalwood", "Amberwood", "Vetiver"].find((w) => !notes.includes(w) && !out.includes(w)) ?? "Cedarwood";
    out.push(swap);
  }
  return out.join(", ");
}

/** Known seed wording first, then a plain word swap for anything the owner wrote. */
function fixText(text: string) {
  return text
    .replace(/a whisper of oud/gi, "smooth sandalwood")
    .replace(/a smooth woody oud base/gi, "a smooth base of sandalwood and ambergris")
    .replace(/\b(white\s+)?(oudh?|agarwood)\b/gi, "sandalwood");
}

async function main() {
  const db = await connect();
  const where = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:") ? process.env.DATABASE_URL : "local data/store.db";
  console.log(`Catalogue update → ${where}${DRY ? " (dry run)" : ""}`);

  const hasTables = await db.execute("select count(*) as n from sqlite_master where type = 'table' and name in ('categories', 'products', 'images')");
  if (Number(hasTables.rows[0].n) < 3) {
    console.log("This database has not been set up yet — the site will create and seed it with the new catalogue on its first visit. Nothing to do.");
    return;
  }

  const writes: InStatement[] = [];

  // 1. Oud & Attar and Gift Sets: categories, products, reviews
  const cats = (await db.execute("select id, slug from categories")).rows;
  const goneCatIds = cats.filter((c) => GONE_CATEGORIES.includes(String(c.slug))).map((c) => Number(c.id));
  const products = (await db.execute("select id, slug, name, category_id, tagline, description, concentration, top_notes, heart_notes, base_notes, variants, images from products")).rows;
  const gone = products.filter((p) => GONE_PRODUCTS.includes(String(p.slug)) || goneCatIds.includes(Number(p.category_id)));
  const goneIds = gone.map((p) => Number(p.id));
  const goneImages = new Set(gone.flatMap((p) => parse<string[]>(p.images, []).map(imgId).filter((x): x is string => !!x)));
  if (goneIds.length) {
    const q = goneIds.map(() => "?").join(",");
    writes.push({ sql: `delete from reviews where product_id in (${q})`, args: goneIds });
    writes.push({ sql: `delete from products where id in (${q})`, args: goneIds });
    console.log(`- removing products: ${gone.map((p) => p.name).join(", ")}`);
  }
  if (goneCatIds.length) {
    writes.push({ sql: `delete from categories where id in (${goneCatIds.map(() => "?").join(",")})`, args: goneCatIds });
    console.log(`- removing collections: ${cats.filter((c) => goneCatIds.includes(Number(c.id))).map((c) => c.slug).join(", ")}`);
  }

  // 2. The real bottle photos, stored like an Admin upload (id = 32 hex chars, WebP blob).
  // The id is the file's hash, so running this again reuses the same rows.
  const photo: Record<"clear" | "blue" | "group", string> = { clear: "", blue: "", group: "" };
  for (const [key, file] of [["clear", "bottle-clear.webp"], ["blue", "bottle-blue.webp"], ["group", "bottles-group.webp"]] as const) {
    const data = readFileSync(path.join(process.cwd(), "public/photos", file));
    const id = createHash("md5").update(data).digest("hex");
    photo[key] = `/api/img/${id}`;
    writes.push({ sql: "insert or ignore into images (id, mime, data, created_at) values (?, ?, ?, ?)", args: [id, "image/webp", data, Date.now()] });
  }
  const ours = new Set(Object.values(photo).map((u) => imgId(u)!));

  // Which of the images products use are the old renders?
  const used = [...new Set(products.flatMap((p) => parse<string[]>(p.images, []).map(imgId).filter((x): x is string => !!x)))];
  const generated = new Set<string>();
  for (const id of used) {
    if (ours.has(id)) continue;
    if (GENERATED.has(id)) { generated.add(id); continue; }
    const row = (await db.execute({ sql: "select mime, data from images where id = ?", args: [id] })).rows[0];
    if (!row) continue;
    const meta = await sharp(Buffer.from(row.data as ArrayBuffer)).metadata().catch(() => null);
    if (row.mime === "image/webp" && meta?.width === 1200 && meta?.height === 1200) generated.add(id);
  }

  // 3. The remaining perfumes: sizes, notes, photos
  for (const p of products) {
    if (goneIds.includes(Number(p.id))) continue;
    const set: Record<string, string> = {};

    const variants = parse<{ size: string }[]>(p.variants, []);
    const kept = variants.filter((v) => v.size.replace(/\s+/g, "").toLowerCase() !== "30ml");
    if (kept.length !== variants.length) {
      if (kept.length) set.variants = JSON.stringify(kept);
      else console.warn(`! ${p.name} only has a 30ml size — left as it is, please edit it in Admin.`);
    }

    for (const col of ["top_notes", "heart_notes", "base_notes"] as const) {
      const v = String(p[col] ?? "");
      if (BANNED.test(v)) set[col] = fixNotes(v);
    }
    for (const col of ["tagline", "description"] as const) {
      const v = String(p[col] ?? "");
      if (BANNED.test(v)) set[col] = fixText(v);
    }
    if (BANNED.test(String(p.concentration ?? ""))) set.concentration = "Eau de Parfum";
    if (BANNED.test(String(p.name))) console.warn(`! "${p.name}" mentions oud/attar/gift in its name — please rename it in Admin.`);

    const images = parse<string[]>(p.images, []);
    const ownPhotos = images.filter((u) => { const id = imgId(u); return !id || (!generated.has(id) && !ours.has(id)); });
    const next = ownPhotos.length ? ownPhotos : [BLUE_BOTTLE.has(String(p.slug)) ? photo.blue : photo.clear, photo.group];
    if (JSON.stringify(next) !== JSON.stringify(images)) set.images = JSON.stringify(next);
    if (ownPhotos.length && images.some((u) => generated.has(imgId(u) ?? ""))) console.log(`  (${p.name}: keeping the owner's own photos)`);

    const cols = Object.keys(set);
    if (cols.length) {
      writes.push({ sql: `update products set ${cols.map((c) => `${c} = ?`).join(", ")} where id = ?`, args: [...cols.map((c) => set[c]), Number(p.id)] });
      console.log(`- ${p.name}: ${cols.join(", ")}`);
    }
  }

  // 4. Settings that mention gifts / oud / attar go back to the default wording
  for (const r of (await db.execute("select key, value from settings")).rows) {
    const key = String(r.key), value = String(r.value);
    if (!BANNED.test(value)) continue;
    const def = DEFAULT_SETTINGS[key];
    if (def !== undefined && !BANNED.test(def)) {
      writes.push({ sql: "update settings set value = ? where key = ?", args: [def, key] });
      console.log(`- setting "${key}" reset (was: ${JSON.stringify(value)})`);
    } else console.warn(`! setting "${key}" mentions gift/oud/attar and has no default — please edit it in Admin → Settings: ${JSON.stringify(value)}`);
  }
  for (const c of cats) {
    if (goneCatIds.includes(Number(c.id))) continue;
    const row = (await db.execute({ sql: "select name, blurb from categories where id = ?", args: [Number(c.id)] })).rows[0];
    if (row && BANNED.test(`${row.name} ${row.blurb}`)) console.warn(`! collection "${row.name}" mentions gift/oud/attar — please edit it in Admin.`);
  }

  if (DRY) { console.log(`Dry run: ${writes.length} statements not written.`); return; }
  await db.batch(writes, "write");

  // 5. Delete the old renders and the removed products' photos, unless something still uses them
  const stillUsed = new Set<string>();
  for (const r of (await db.execute("select images from products")).rows) for (const u of parse<string[]>(r.images, [])) { const id = imgId(u); if (id) stillUsed.add(id); }
  for (const r of (await db.execute("select items from orders")).rows) for (const it of parse<{ image?: string | null }[]>(r.items, [])) { const id = it.image && imgId(it.image); if (id) stillUsed.add(id); }
  const drop = [...new Set([...generated, ...goneImages, ...GENERATED])].filter((id) => !stillUsed.has(id) && !ours.has(id));
  if (drop.length) {
    const res = await db.execute({ sql: `delete from images where id in (${drop.map(() => "?").join(",")})`, args: drop });
    console.log(`- deleted ${res.rowsAffected} old generated image(s)`);
  }

  const n = await db.execute("select (select count(*) from products) as products, (select count(*) from categories) as categories, (select count(*) from images) as images");
  console.log(`Done. Now ${n.rows[0].products} products, ${n.rows[0].categories} collections, ${n.rows[0].images} stored images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
