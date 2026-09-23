import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm, type Init } from "@/components/admin/ProductForm";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const id = Number((await params).id);
  const db = await getDb();
  const [[p], cats] = await Promise.all([
    db.select().from(s.products).where(eq(s.products.id, id)),
    db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.sort)),
  ]);
  if (!p) notFound();
  const init: Init = {
    id: p.id, name: p.name, slug: p.slug, tagline: p.tagline ?? "", description: p.description ?? "", categoryId: p.categoryId,
    concentration: p.concentration ?? "", topNotes: p.topNotes ?? "", heartNotes: p.heartNotes ?? "", baseNotes: p.baseNotes ?? "",
    longevity: p.longevity ?? 4, sillage: p.sillage ?? 3, variants: p.variants, images: p.images, color: p.color ?? "#b8860b", shape: p.shape ?? 0,
    featured: !!p.featured, bestseller: !!p.bestseller, isNew: !!p.isNew, active: !!p.active,
  };
  return (<><PageTitle title={p.name} sub={`${p.sold} sold · added ${new Date(p.createdAt).toLocaleDateString("en-GB")}`} /><ProductForm key={p.id} initial={init} cats={cats} /></>);
}
