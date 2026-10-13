import { asc } from "drizzle-orm";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { ensureAttarCategory } from "@/app/actions/admin";
import { getFeatures } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProduct({ searchParams }: PageProps<"/admin/products/new">) {
  // "Add attar product" in Store Features lands here with the Attar category and small sizes filled in
  const attar = (await searchParams).attar === "1";
  const attarId = attar ? await ensureAttarCategory() : null;
  const db = await getDb();
  const [cats, f] = await Promise.all([db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.sort)), getFeatures()]);
  return (
    <>
      <PageTitle title={attar ? "New attar" : "New product"} sub={attar && !f.attar ? "It is saved now and appears on the store once you turn Attar ON in Store Features." : "Fill in the details — it goes live as soon as you save."} />
      <ProductForm cats={cats} saleOn={f.sale} attarCategoryId={attarId ?? undefined} />
    </>
  );
}
