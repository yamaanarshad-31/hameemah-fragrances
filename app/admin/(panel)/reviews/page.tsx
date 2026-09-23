import { desc, eq } from "drizzle-orm";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";
import { Card, PageTitle } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/Confirm";
import { deleteReview, setReviewApproved } from "@/app/actions/admin";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  const db = await getDb();
  const rows = await db.select({ r: s.reviews, product: s.products.name }).from(s.reviews).leftJoin(s.products, eq(s.reviews.productId, s.products.id)).orderBy(s.reviews.approved, desc(s.reviews.createdAt));
  const waiting = rows.filter((x) => !x.r.approved).length;
  return (
    <>
      <PageTitle title="Reviews" sub={waiting ? `${waiting} new review${waiting > 1 ? "s" : ""} waiting for approval` : "Customer reviews appear on the store only after you approve them."} />
      <div className="space-y-3">
        {rows.map(({ r, product }) => (
          <Card key={r.id} className={`!p-4 ${r.approved ? "" : "border-l-4 !border-l-gold"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex text-gold" aria-label={`${r.rating} stars`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={`size-4 ${k <= r.rating ? "fill-gold" : "opacity-25"}`} />)}</span>
                  <b>{r.name}</b><span className="text-sm text-muted">{r.city} · on {product ?? "deleted product"}</span>
                  {!r.approved && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Awaiting approval</span>}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{r.body}</p>
              </div>
              <div className="flex gap-2">
                {r.approved
                  ? <ActionButton action={setReviewApproved.bind(null, r.id, false)} className="flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm"><EyeOff className="size-4" /> Hide</ActionButton>
                  : <ActionButton action={setReviewApproved.bind(null, r.id, true)} className="flex items-center gap-1.5 rounded-xl bg-emerald px-3 py-2 text-sm font-semibold text-cream"><Check className="size-4" /> Approve</ActionButton>}
                <ActionButton action={deleteReview.bind(null, r.id)} confirmText="Delete this review?" className="rounded-xl p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></ActionButton>
              </div>
            </div>
          </Card>
        ))}
        {!rows.length && <Card><p className="py-8 text-center text-muted">No reviews yet.</p></Card>}
      </div>
    </>
  );
}
