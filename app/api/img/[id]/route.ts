import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";

export async function GET(_: Request, ctx: RouteContext<"/api/img/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const [img] = await db.select().from(s.images).where(eq(s.images.id, id));
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
