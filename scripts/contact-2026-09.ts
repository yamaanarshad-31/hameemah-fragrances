/**
 * The shop's real contact details, September 2026. Safe to run more than once.
 *
 * Writes WhatsApp, phone, email and the Instagram / Facebook / TikTok links into `settings`
 * (the same values lib/db/seed.ts now gives a fresh database). Other settings are untouched.
 *
 * Local:       npx tsx scripts/contact-2026-09.ts
 * Production:  DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npx tsx scripts/contact-2026-09.ts
 * Add --dry-run to print what would change without writing anything.
 */
import type { Client } from "@libsql/client";
import { DEFAULT_SETTINGS } from "../lib/db/seed";

const DRY = process.argv.includes("--dry-run");
const KEYS = ["whatsapp", "phone", "email", "instagram", "facebook", "tiktok"] as const;

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

async function main() {
  const db = await connect();
  const where = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:") ? process.env.DATABASE_URL : "local data/store.db";
  console.log(`Contact details → ${where}${DRY ? " (dry run)" : ""}`);

  const has = await db.execute("select count(*) as n from sqlite_master where type = 'table' and name = 'settings'");
  if (!Number(has.rows[0].n)) {
    console.log("This database has not been set up yet — the site seeds it with these details on its first visit. Nothing to do.");
    return;
  }
  const current = new Map((await db.execute("select key, value from settings")).rows.map((r) => [String(r.key), String(r.value)]));
  const writes = KEYS.filter((k) => current.get(k) !== DEFAULT_SETTINGS[k]).map((k) => {
    console.log(`- ${k}: ${current.get(k) ?? "(unset)"} → ${DEFAULT_SETTINGS[k]}`);
    return { sql: "insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", args: [k, DEFAULT_SETTINGS[k]] };
  });
  if (!writes.length) return console.log("Already up to date.");
  if (DRY) return console.log(`Dry run: ${writes.length} settings not written.`);
  await db.batch(writes, "write");
  console.log(`Done. ${writes.length} settings updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
