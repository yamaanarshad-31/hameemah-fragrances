import type { Metadata } from "next";

/**
 * Public origin used for canonicals, sitemap, Open Graph and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL (e.g. https://www.fragrancesbyhameemah.com) in the host's env vars.
 * On Vercel it falls back to the production domain; locally to the dev server.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.NODE_ENV === "production" ? "https://www.fragrancesbyhameemah.com" : "http://localhost:3014")
).replace(/\/$/, "");
export const BRAND = "Fragrances by Hameemah";
export const STORE_ID = `${SITE_URL}/#store`;

/** Absolute URL for a site path or an already-absolute URL. */
export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/** Cut text on a word boundary so descriptions don't end mid-word. */
export function clip(text: string | null | undefined, max = 155) {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(" ", max - 1)).replace(/[,;:—–-]+$/, "") + "…";
}

/** app/opengraph-image.jpg — restated because a page's own openGraph object drops the file-based image. */
export const DEFAULT_OG = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "Fragrances by Hameemah — long-lasting luxury perfumes delivered across Pakistan" };

/**
 * Per-page metadata with canonical, Open Graph and Twitter tags.
 * Child metadata replaces the parent's openGraph/twitter objects wholesale, so this re-adds the shared bits.
 */
export function pageMeta({ title, description, path, images = [DEFAULT_OG] }: { title: string; description: string; path: string; images?: { url: string; alt: string; width?: number; height?: number }[] }): Metadata {
  const full = `${title} | ${BRAND}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: BRAND, locale: "en_PK", url: path, title: full, description, images },
    twitter: { card: "summary_large_image", title: full, description, images },
  };
}

/** Serialise JSON-LD safely for a <script> tag. */
export const ld = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
