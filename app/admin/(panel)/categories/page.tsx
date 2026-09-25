import { asc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { Card, PageTitle, inputCls, labelCls } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/Confirm";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function Categories() {
  const db = await getDb();
  const [cats, prods] = await Promise.all([db.select().from(s.categories).orderBy(asc(s.categories.sort)), db.select({ c: s.products.categoryId }).from(s.products)]);
  return (
    <>
      <PageTitle title="Categories" sub="Collections shown in the store menu and on the home page." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {cats.map((c) => (
            <Card key={c.id} className="!p-4">
              <form action={saveCategory} className="grid items-end gap-3 sm:grid-cols-[48px_1fr_1fr_80px_auto]">
                <input type="hidden" name="id" value={c.id} />
                <label><span className="sr-only">Colour</span><input type="color" name="color" defaultValue={c.color ?? "#0f3d2a"} className="h-11 w-12 cursor-pointer rounded-lg" /></label>
                <label><span className={labelCls}>Name</span><input name="name" defaultValue={c.name} className={`${inputCls} mt-1`} /></label>
                <label><span className={labelCls}>Subtitle</span><input name="blurb" defaultValue={c.blurb ?? ""} className={`${inputCls} mt-1`} /></label>
                <label><span className={labelCls}>Order</span><input name="sort" type="number" defaultValue={c.sort ?? 0} className={`${inputCls} mt-1`} /></label>
                <div className="flex items-center gap-2">
                  <input type="hidden" name="slug" value={c.slug} />
                  <button className="min-h-11 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-cream">Save</button>
                  <ActionButton action={deleteCategory.bind(null, c.id)} label={`Delete ${c.name}`} confirmText={`Delete "${c.name}"? Its products stay but lose this category.`} className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></ActionButton>
                </div>
              </form>
              <p className="mt-2 text-xs text-muted">/collections/{c.slug} · {(() => { const n = prods.filter((p) => p.c === c.id).length; return `${n} product${n === 1 ? "" : "s"}`; })()}</p>
            </Card>
          ))}
        </div>
        <Card className="self-start">
          <p className="font-semibold">Add category</p>
          <form action={saveCategory} className="mt-4 space-y-3">
            <label className="block"><span className={labelCls}>Name</span><input name="name" required className={`${inputCls} mt-1`} placeholder="e.g. Body Mists" /></label>
            <label className="block"><span className={labelCls}>Subtitle</span><input name="blurb" className={`${inputCls} mt-1`} placeholder="Light & refreshing" /></label>
            <div className="flex gap-3">
              <label className="block"><span className={labelCls}>Colour</span><input type="color" name="color" defaultValue="#0f3d2a" className="mt-1 h-11 w-14 rounded-lg" /></label>
              <label className="block min-w-0 flex-1"><span className={labelCls}>Order</span><input name="sort" type="number" defaultValue={cats.length + 1} className={`${inputCls} mt-1`} /></label>
            </div>
            <button className="btn-gold min-h-11 w-full rounded-xl py-3 text-sm font-bold">Add category</button>
          </form>
        </Card>
      </div>
    </>
  );
}
