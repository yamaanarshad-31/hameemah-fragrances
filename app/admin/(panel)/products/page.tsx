import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { ButtonLink, Card, PageTitle } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { ProductImage } from "@/components/store/ProductImage";
import { getDb, schema as s } from "@/lib/db";
import { rs } from "@/lib/format";

export const metadata = { title: "Products" };

export default async function Products({ searchParams }: PageProps<"/admin/products">) {
  const q = String((await searchParams).q ?? "").toLowerCase();
  const db = await getDb();
  const [all, cats] = await Promise.all([db.select().from(s.products).orderBy(desc(s.products.createdAt)), db.select().from(s.categories)]);
  const list = q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  return (
    <>
      <PageTitle title="Products" sub={`${all.length} perfumes · ${all.filter((p) => p.active).length} live on the store`} action={<ButtonLink href="/admin/products/new"><Plus className="size-4" /> Add product</ButtonLink>} />
      <Card className="!p-0">
        <form className="border-b border-black/5 p-4"><input name="q" defaultValue={q} placeholder="Search products…" aria-label="Search products" className="w-full max-w-xs rounded-xl border border-black/10 px-3.5 py-2 text-sm focus:border-emerald focus:outline-none" /></form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="px-4 py-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {list.map((p) => {
                const stock = p.variants.reduce((a, v) => a + v.stock, 0);
                const prices = p.variants.map((v) => v.price);
                return (
                  <tr key={p.id} className="border-t border-black/5 hover:bg-black/[.015]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={p.images[0]} color={p.color} shape={p.shape} name={p.name} sizes="48px" /></span>
                        <span><span className="block font-semibold hover:text-emerald">{p.name}</span><span className="text-xs text-muted">{p.variants.map((v) => v.size).join(" · ")}</span></span>
                      </Link>
                    </td>
                    <td>{cats.find((c) => c.id === p.categoryId)?.name ?? <span className="text-muted">—</span>}</td>
                    <td className="tabular-nums">{Math.min(...prices) === Math.max(...prices) ? rs(prices[0]) : `${rs(Math.min(...prices))} – ${rs(Math.max(...prices))}`}</td>
                    <td className={`tabular-nums ${stock === 0 ? "font-semibold text-red-700" : stock < 10 ? "text-amber-700" : ""}`}>{stock}</td>
                    <td className="tabular-nums">{p.sold}</td>
                    <td><ProductRowActions id={p.id} active={!!p.active} slug={p.slug} /></td>
                    <td className="pr-4 text-right"><Link href={`/admin/products/${p.id}`} className="font-semibold text-emerald hover:underline">Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!list.length && <p className="py-12 text-center text-muted">No products found.</p>}
        </div>
      </Card>
    </>
  );
}
