import { getCategories, getProducts, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Plain-text summary for AI assistants and answer engines (llmstxt.org). */
export async function GET() {
  const [s, cats, products] = await Promise.all([getSettings(), getCategories(), getProducts({ sort: "popular" })]);
  const lines = [
    "# Fragrances by Hameemah",
    "",
    "> Online perfume house in Pakistan selling long-lasting luxury perfumes (Eau de Parfum, Extrait) for men and women in 50ml and 100ml bottles. Cash on delivery nationwide.",
    "",
    `- Delivery: all over Pakistan, usually 2–4 working days. Delivery charge Rs. ${s.shippingFee}; free above Rs. ${s.freeShippingOver}.`,
    "- Payment: cash on delivery, bank transfer, JazzCash, Easypaisa.",
    "- Exchange: unused sealed bottles within 7 days; damaged/wrong items replaced free.",
    `- Contact: WhatsApp ${s.phone}, email ${s.email}`,
    "",
    "## Collections",
    ...cats.map((c) => `- [${c.name}](${SITE_URL}/collections/${c.slug}): ${c.blurb}`),
    "",
    "## Perfumes",
    ...products.map((p) => `- [${p.name}](${SITE_URL}/product/${p.slug}): ${p.tagline}. Notes: ${[p.topNotes, p.heartNotes, p.baseNotes].filter(Boolean).join("; ")}. Sizes: ${p.variants.map((v) => `${v.size} Rs. ${v.price}`).join(", ")}.`),
    "",
    "## Pages",
    `- [Shop all](${SITE_URL}/shop)`, `- [Track an order](${SITE_URL}/track-order)`, `- [Policies](${SITE_URL}/policies)`, `- [About](${SITE_URL}/about)`, `- [Contact](${SITE_URL}/contact)`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
