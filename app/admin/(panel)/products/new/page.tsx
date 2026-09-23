import { asc } from "drizzle-orm";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const db = await getDb();
  const cats = await db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.sort));
  return (<><PageTitle title="New product" sub="Fill in the details — it goes live as soon as you save." /><ProductForm cats={cats} /></>);
}
