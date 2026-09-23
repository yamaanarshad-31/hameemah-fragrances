import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const db = await getDb();
  const rows = await db.select().from(s.subscribers).orderBy(desc(s.subscribers.createdAt));
  const csv = "email,joined\n" + rows.map((r) => `${r.email},${new Date(r.createdAt).toISOString()}`).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=subscribers.csv" } });
}
