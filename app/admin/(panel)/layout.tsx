import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const db = await getDb();
  const [[p], [r]] = await Promise.all([
    db.select({ n: count() }).from(s.orders).where(eq(s.orders.status, "pending")),
    db.select({ n: count() }).from(s.reviews).where(eq(s.reviews.approved, false)),
  ]);
  return (
    <div className="min-h-dvh bg-[#f4f1ea] text-ink">
      <Sidebar pending={p.n} reviews={r.n} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
