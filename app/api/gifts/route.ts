import { getGiftSets } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Current gift-set prices and stock, so the bag can refresh what it shows before checkout. */
export async function GET() {
  return Response.json((await getGiftSets()).map((g) => ({ id: g.id, price: g.price, stock: g.stock })));
}
