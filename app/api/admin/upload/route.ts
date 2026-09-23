import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, 8);
  const db = await getDb();
  const urls: string[] = [];
  for (const f of files) {
    if (!f.type.startsWith("image/") || f.size > 12 * 1024 * 1024) continue;
    try {
      const data = await sharp(Buffer.from(await f.arrayBuffer())).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const id = randomUUID().replace(/-/g, "");
      await db.insert(s.images).values({ id, mime: "image/webp", data, createdAt: Date.now() });
      urls.push(`/api/img/${id}`);
    } catch {
      // not a readable image — skip it
    }
  }
  if (!urls.length) return Response.json({ error: "Please upload JPG, PNG or WEBP images under 12 MB." }, { status: 400 });
  return Response.json({ urls });
}
