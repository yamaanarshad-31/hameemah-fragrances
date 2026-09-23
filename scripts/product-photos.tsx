// Renders two studio-style product photos per perfume from the drawn bottle
// and stores them as the product's images. Run: npx tsx scripts/product-photos.tsx
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { Bottle } from "../components/store/Bottle";

const db = createClient({ url: process.env.DATABASE_URL || "file:data/store.db", authToken: process.env.DATABASE_AUTH_TOKEN });

function mix(hex: string, to: string, t: number) {
  const a = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const b = to.match(/\w\w/g)!.map((x) => parseInt(x, 16));
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

function bottleSvg(color: string, shape: number, name: string) {
  const s = renderToStaticMarkup(<Bottle color={color} shape={shape} name={name} />);
  return s.replace("<svg", '<svg preserveAspectRatio="xMidYMid meet"');
}

function scene(color: string, shape: number, name: string, id: number, light: boolean) {
  const S = 1200;
  const r = rng(id * 97 + (light ? 7 : 1));
  const bokeh = Array.from({ length: 16 }, () => {
    const x = r() * S, y = r() * S * 0.7, rad = 10 + r() * 46;
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${light ? "#d4af37" : "#f3dc8f"}" opacity="${0.08 + r() * 0.22}"/>`;
  }).join("");
  const bg1 = light ? "#f7f1e3" : mix(color, "#06140d", 0.55);
  const bg2 = light ? mix(color, "#efe5cf", 0.82) : "#06140d";
  const glow = light ? mix(color, "#ffffff", 0.55) : mix(color, "#f3dc8f", 0.25);
  const podTop = light ? "#ffffff" : "#1b5a3e";
  const podSide = light ? "#e7dcc3" : "#0c3322";
  const bottle = bottleSvg(color, shape, name).replace("<svg", `<svg x="330" y="206" width="540" height="810"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".45" r=".45"><stop offset="0" stop-color="${glow}" stop-opacity=".75"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${light ? 0.55 : 0.18}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="podS" x1="0" x2="1"><stop offset="0" stop-color="${mix(podSide, "#000000", 0.25)}"/><stop offset=".45" stop-color="${podSide}"/><stop offset="1" stop-color="${mix(podSide, "#000000", 0.35)}"/></linearGradient>
    <radialGradient id="podT" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${podTop}"/><stop offset="1" stop-color="${mix(podTop, podSide, 0.6)}"/></radialGradient>
    <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#8a6a14"/><stop offset=".5" stop-color="#f3dc8f"/><stop offset="1" stop-color="#b8922a"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <g filter="url(#blur)">${bokeh}</g>
  <polygon points="480,0 720,0 900,${S} 300,${S}" fill="url(#beam)"/>
  <circle cx="600" cy="560" r="470" fill="url(#glow)"/>
  <path d="M-40 ${light ? 880 : 900} C 260 780, 420 1010, 700 900 S 1100 820, 1260 930" fill="none" stroke="url(#gold)" stroke-width="3" opacity="${light ? 0.5 : 0.35}"/>
  <path d="M-40 ${light ? 920 : 940} C 300 830, 460 1050, 740 940 S 1120 870, 1260 980" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="${light ? 0.35 : 0.25}"/>
  <!-- podium -->
  <path d="M250 960 L250 1120 A350 70 0 0 0 950 1120 L950 960 Z" fill="url(#podS)"/>
  <ellipse cx="600" cy="960" rx="350" ry="70" fill="url(#podT)"/>
  <ellipse cx="600" cy="960" rx="350" ry="70" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <ellipse cx="600" cy="968" rx="230" ry="34" fill="#000" opacity="${light ? 0.18 : 0.4}" filter="url(#soft)"/>
  ${bottle}
</svg>`;
}

async function main() {
const { rows } = await db.execute("select id, name, slug, color, shape, images from products");
for (const p of rows) {
  const color = String(p.color || "#b8860b");
  // replace photos from an earlier run of this script instead of piling them up
  const old = (JSON.parse(String(p.images || "[]")) as string[]).filter((u) => u.startsWith("/api/img/")).map((u) => u.slice(9));
  for (const id of old) await db.execute({ sql: "delete from images where id = ?", args: [id] });
  const urls: string[] = [];
  for (const light of [false, true]) {
    const svg = scene(color, Number(p.shape ?? 0), String(p.name), Number(p.id), light);
    const data = await sharp(Buffer.from(svg), { density: 96 }).webp({ quality: 84 }).toBuffer();
    const id = randomUUID().replace(/-/g, "");
    await db.execute({ sql: "insert into images (id, mime, data, created_at) values (?, ?, ?, ?)", args: [id, "image/webp", data, Date.now()] });
    urls.push(`/api/img/${id}`);
    if (process.env.PREVIEW) await sharp(Buffer.from(svg)).png().toFile(`${process.env.PREVIEW}/${p.slug}-${light ? "light" : "dark"}.png`);
  }
  await db.execute({ sql: "update products set images = ? where id = ?", args: [JSON.stringify(urls), p.id] });
  console.log("✓", p.name);
}
}
main();
