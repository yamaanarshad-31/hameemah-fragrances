import { getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 60).trim() || "";
  const list = await getProducts(q ? { q, limit: 12 } : { flag: "bestseller", limit: 4 });
  return Response.json(
    list.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, tagline: p.tagline,
      price: Math.min(...p.variants.map((v) => v.price)),
      image: p.images[0] ?? null, color: p.color, shape: p.shape,
    })),
  );
}
