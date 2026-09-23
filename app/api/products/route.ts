import { getProducts } from "@/lib/data";
import { toCard } from "@/lib/card";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
  const list = await getProducts({ ids });
  return Response.json(list.map(toCard));
}
